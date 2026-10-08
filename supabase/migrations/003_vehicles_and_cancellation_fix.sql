-- ============================================================================
-- Migration: 003_vehicles_and_cancellation_fix.sql
-- Description:
-- 1. Fix cancellation lockout by dropping rigid table constraints and
--    creating partial unique indexes on active bookings (WHERE lower(status) != 'cancelled').
-- 2. Update create_booking_transaction and cancel_booking RPCs to ignore cancelled bookings.
-- 3. Create dedicated public.vehicles table with RLS and unique constraint (user_id, vehicle_plate).
-- 4. Trigger to ensure only one default vehicle per user and sync with public.profiles.
-- 5. Backfill vehicles from public.profiles and historical bookings.
-- ============================================================================

-- ============================================================================
-- 1. Fix Cancellation Lockout (Allow Re-Booking After Cancellation)
-- ============================================================================

-- Drop rigid constraints if they still exist from earlier migrations
alter table public.bookings drop constraint if exists bookings_date_vehicle_unique;
alter table public.bookings drop constraint if exists bookings_date_token_unique;
alter table public.bookings drop constraint if exists bookings_vehicle_date_unique;

-- Drop prior active indexes to ensure consistent naming and filter definitions
drop index if exists public.idx_unique_active_vehicle_date;
drop index if exists public.bookings_date_vehicle_active_idx;
drop index if exists public.idx_unique_active_token_date;
drop index if exists public.bookings_date_token_active_idx;

-- Create partial unique index on active vehicle bookings
-- Case-insensitive check on status ensures both 'Cancelled' and 'cancelled' are excluded
create unique index idx_unique_active_vehicle_date
  on public.bookings (date, upper(trim(vehicle_no)))
  where lower(status) != 'cancelled';

-- Create partial unique index on active token allocations
create unique index idx_unique_active_token_date
  on public.bookings (date, token_no)
  where lower(status) != 'cancelled';

-- Ensure mileage column exists
alter table public.bookings add column if not exists mileage text;

-- ============================================================================
-- 2. Update create_booking_transaction RPC
-- ============================================================================

create or replace function public.create_booking_transaction(
  p_date date,
  p_name text,
  p_phone text,
  p_nic text,
  p_bike_model text,
  p_vehicle_no text,
  p_service_type text,
  p_user_id uuid default null,
  p_mileage text default null
)
returns public.bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  next_token integer;
  created_booking public.bookings;
  total_booked integer;
  free_services integer;
  standard_services integer;
  is_admin boolean := public.is_admin();
  booking_user_id uuid := auth.uid();
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if not is_admin and p_date <= current_date then
    raise exception 'BOOKING_CLOSED_FOR_DATE';
  end if;
  if is_admin and p_date < current_date then
    raise exception 'PAST_DATE';
  end if;
  if extract(isodow from p_date) = 1 then
    raise exception 'CLOSED_DATE';
  end if;
  if p_name is null or length(trim(p_name)) = 0
     or p_bike_model is null or length(trim(p_bike_model)) = 0
     or p_vehicle_no is null or length(trim(p_vehicle_no)) = 0
     or p_phone !~ '^0[0-9]{9}$' then
    raise exception 'INVALID_BOOKING_DATA';
  end if;
  if p_service_type not in ('Free Service', 'Full Service', 'Normal Service') then
    raise exception 'INVALID_SERVICE_TYPE';
  end if;

  perform pg_advisory_xact_lock(hashtext(p_date::text));

  -- Check if vehicle is already booked with active (non-cancelled) status on this date
  if exists (
    select 1 from public.bookings
     where date = p_date
       and upper(trim(vehicle_no)) = upper(trim(p_vehicle_no))
       and lower(status) != 'cancelled'
  ) then
    raise exception 'DUPLICATE_BOOKING';
  end if;

  select count(*) filter (where lower(status) != 'cancelled'),
         count(*) filter (where service_type = 'Free Service' and lower(status) != 'cancelled'),
         count(*) filter (where service_type in ('Full Service', 'Normal Service') and lower(status) != 'cancelled')
    into total_booked, free_services, standard_services
    from public.bookings
   where date = p_date;

  if total_booked >= 12 then
    raise exception 'SLOT_FULL';
  end if;
  if p_service_type = 'Free Service' and free_services >= 5 then
    raise exception 'FREE_SERVICE_FULL';
  end if;
  if p_service_type in ('Full Service', 'Normal Service') and standard_services >= 7 then
    raise exception 'STANDARD_SERVICE_FULL';
  end if;

  -- Determine next sequential token number (1..12)
  select coalesce(max(token_no), 0) + 1 into next_token
    from public.bookings
   where date = p_date;

  -- If sequential count exceeded 12 (due to past cancellations), allocate the lowest free slot (1..12)
  if next_token > 12 then
    select s.token into next_token
      from generate_series(1, 12) as s(token)
     where not exists (
       select 1 from public.bookings b
        where b.date = p_date
          and b.token_no = s.token
          and lower(b.status) != 'cancelled'
     )
     order by s.token
     limit 1;
  end if;

  if next_token is null or next_token > 12 then
    raise exception 'SLOT_FULL';
  end if;

  insert into public.bookings (
    token_no, time_slot, name, phone, nic, bike_model, mileage, vehicle_no,
    service_type, status, date, user_id
  ) values (
    next_token,
    to_char((time '08:30' + ((next_token - 1) * interval '45 minutes'))::time, 'HH12:MI AM'),
    trim(p_name), regexp_replace(p_phone, '[[:space:]-]', '', 'g'), upper(trim(coalesce(p_nic, 'N/A'))),
    trim(p_bike_model), nullif(trim(p_mileage), ''), upper(trim(p_vehicle_no)), p_service_type, 'Pending', p_date, booking_user_id
  ) returning * into created_booking;

  return created_booking;
exception
  when unique_violation then
    raise exception 'DUPLICATE_BOOKING';
end;
$$;

grant execute on function public.create_booking_transaction(date, text, text, text, text, text, text, uuid, text) to authenticated;

-- Update cancel_booking to support admin role check via public.is_admin()
create or replace function public.cancel_booking(p_booking_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking public.bookings;
  v_is_admin boolean := public.is_admin();
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select * into v_booking
    from public.bookings
   where id = p_booking_id;

  if v_booking.id is null then
    raise exception 'BOOKING_NOT_FOUND';
  end if;

  if not v_is_admin and (v_booking.user_id is null or v_booking.user_id <> auth.uid()) then
    raise exception 'NOT_AUTHORIZED';
  end if;

  if v_booking.status = 'Completed' then
    raise exception 'CANNOT_CANCEL_COMPLETED';
  end if;

  update public.bookings
     set status = 'Cancelled'
   where id = p_booking_id;

  return jsonb_build_object('success', true, 'id', p_booking_id, 'status', 'Cancelled');
end;
$$;

grant execute on function public.cancel_booking(uuid) to authenticated;

-- ============================================================================
-- 3. Create public.vehicles Table
-- ============================================================================

create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  bike_model text not null,
  vehicle_plate text not null,
  is_default boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint vehicles_user_plate_unique unique (user_id, vehicle_plate)
);

-- Case-insensitive / whitespace trimmed unique index
create unique index if not exists idx_vehicles_user_normalized_plate
  on public.vehicles (user_id, upper(trim(vehicle_plate)));

-- Performance index
create index if not exists idx_vehicles_user_id on public.vehicles(user_id);

-- Trigger: Normalize fields & ensure only ONE default vehicle per user
create or replace function public.handle_vehicle_normalization_and_default()
returns trigger
language plpgsql
as $$
begin
  new.vehicle_plate := upper(trim(new.vehicle_plate));
  new.bike_model := trim(new.bike_model);
  new.updated_at := now();

  -- If this bike is marked default, unset is_default on other bikes belonging to this user
  if new.is_default then
    update public.vehicles
       set is_default = false
     where user_id = new.user_id
       and id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid);
  end if;

  return new;
end;
$$;

drop trigger if exists on_vehicles_normalize_default on public.vehicles;
create trigger on_vehicles_normalize_default
  before insert or update on public.vehicles
  for each row execute function public.handle_vehicle_normalization_and_default();

-- Trigger: When default vehicle changes, sync with public.profiles(default_bike_model, default_vehicle_plate)
create or replace function public.sync_profile_default_vehicle()
returns trigger
language plpgsql
as $$
begin
  if new.is_default then
    update public.profiles
       set default_bike_model = new.bike_model,
           default_vehicle_plate = new.vehicle_plate,
           updated_at = now()
     where id = new.user_id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_vehicle_default_sync_profile on public.vehicles;
create trigger on_vehicle_default_sync_profile
  after insert or update on public.vehicles
  for each row
  when (new.is_default = true)
  execute function public.sync_profile_default_vehicle();

-- ============================================================================
-- 4. Row Level Security (RLS) for public.vehicles
-- ============================================================================

alter table public.vehicles enable row level security;

revoke all on public.vehicles from anon, authenticated;
grant select, insert, update, delete on public.vehicles to authenticated;

-- SELECT: Users view their own vehicles, Admins view all vehicles
drop policy if exists vehicles_select_policy on public.vehicles;
create policy vehicles_select_policy on public.vehicles
  for select to authenticated
  using (
    auth.uid() = user_id
    or public.is_admin()
  );

-- INSERT: Users insert vehicles for themselves, Admins can insert
drop policy if exists vehicles_insert_policy on public.vehicles;
create policy vehicles_insert_policy on public.vehicles
  for insert to authenticated
  with check (
    auth.uid() = user_id
    or public.is_admin()
  );

-- UPDATE: Users update their own vehicles, Admins can update
drop policy if exists vehicles_update_policy on public.vehicles;
create policy vehicles_update_policy on public.vehicles
  for update to authenticated
  using (
    auth.uid() = user_id
    or public.is_admin()
  )
  with check (
    auth.uid() = user_id
    or public.is_admin()
  );

-- DELETE: Users delete their own vehicles, Admins can delete
drop policy if exists vehicles_delete_policy on public.vehicles;
create policy vehicles_delete_policy on public.vehicles
  for delete to authenticated
  using (
    auth.uid() = user_id
    or public.is_admin()
  );

-- ============================================================================
-- 5. Data Backfill & Sync
-- ============================================================================

-- A. Backfill from profiles (default_bike_model & default_vehicle_plate)
insert into public.vehicles (user_id, bike_model, vehicle_plate, is_default)
select
  p.id as user_id,
  coalesce(nullif(trim(p.default_bike_model), ''), 'Yamaha Bike') as bike_model,
  upper(trim(p.default_vehicle_plate)) as vehicle_plate,
  true as is_default
from public.profiles p
where p.default_vehicle_plate is not null
  and length(trim(p.default_vehicle_plate)) > 0
on conflict (user_id, vehicle_plate) do update
  set is_default = true;

-- B. Backfill distinct historical vehicles from bookings for registered profiles
insert into public.vehicles (user_id, bike_model, vehicle_plate, is_default)
select distinct on (b.user_id, upper(trim(b.vehicle_no)))
  b.user_id,
  coalesce(nullif(trim(b.bike_model), ''), 'Yamaha Bike') as bike_model,
  upper(trim(b.vehicle_no)) as vehicle_plate,
  false as is_default
from public.bookings b
where b.user_id is not null
  and b.vehicle_no is not null
  and length(trim(b.vehicle_no)) > 0
  and exists (select 1 from public.profiles p where p.id = b.user_id)
on conflict (user_id, vehicle_plate) do nothing;

-- C. Ensure each user with vehicles has exactly one default
with users_without_default as (
  select user_id
  from public.vehicles
  group by user_id
  having count(*) filter (where is_default) = 0
),
first_vehicle as (
  select distinct on (v.user_id) v.id
  from public.vehicles v
  join users_without_default u on u.user_id = v.user_id
  order by v.user_id, v.created_at asc
)
update public.vehicles
   set is_default = true
 where id in (select id from first_vehicle);
