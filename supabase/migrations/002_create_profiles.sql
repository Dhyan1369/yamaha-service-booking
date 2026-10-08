-- ============================================================================
-- Migration: 002_create_profiles.sql
-- Description: Creates public.profiles table, sets up non-recursive RLS policies,
--              triggers automatic profile creation on auth.users insert,
--              backfills existing users, and establishes foreign key integrity with bookings.
-- ============================================================================

-- 1. Create public.profiles Table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  nic text,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  default_bike_model text,
  default_vehicle_plate text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Ensure updated_at trigger exists
create or replace function public.handle_profile_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_profiles_updated on public.profiles;
create trigger on_profiles_updated
  before update on public.profiles
  for each row execute function public.handle_profile_updated_at();

-- Indexes for performance
create index if not exists profiles_phone_idx on public.profiles(phone);
create index if not exists profiles_role_idx on public.profiles(role);

-- 2. Non-Recursive Security Definer Admin Check
-- Using SECURITY DEFINER with set search_path prevents infinite recursion loops
-- when checking admin status within RLS policies on public.profiles.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public, auth
stable
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    false
  ) or exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

grant execute on function public.is_admin() to anon, authenticated;

-- 3. Row Level Security (RLS) on public.profiles
alter table public.profiles enable row level security;

revoke all on public.profiles from anon, authenticated;
grant select, insert, update on public.profiles to authenticated;

-- SELECT Policies:
-- Users can view their own profile; Admins can view all profiles
drop policy if exists profiles_select_policy on public.profiles;
create policy profiles_select_policy on public.profiles
  for select to authenticated
  using (
    auth.uid() = id
    or public.is_admin()
  );

-- INSERT Policies:
-- Authenticated users or admins can insert their initial profile
drop policy if exists profiles_insert_policy on public.profiles;
create policy profiles_insert_policy on public.profiles
  for insert to authenticated
  with check (
    auth.uid() = id
    or public.is_admin()
  );

-- UPDATE Policies:
-- Users can update their own profile (cannot escalate their role to admin);
-- Admins can update any profile and change roles
drop policy if exists profiles_update_policy on public.profiles;
create policy profiles_update_policy on public.profiles
  for update to authenticated
  using (
    auth.uid() = id
    or public.is_admin()
  )
  with check (
    public.is_admin()
    or (
      auth.uid() = id
      and role = 'customer'
    )
  );

-- Update public.bookings RLS policies to seamlessly utilize public.is_admin()
drop policy if exists bookings_select_policy on public.bookings;
create policy bookings_select_policy on public.bookings
  for select to authenticated
  using (
    user_id = auth.uid()
    or public.is_admin()
  );

drop policy if exists bookings_update_policy on public.bookings;
create policy bookings_update_policy on public.bookings
  for update to authenticated
  using (
    public.is_admin()
    or (user_id = auth.uid() and status = 'Pending')
  )
  with check (
    public.is_admin()
    or (user_id = auth.uid() and status = 'Cancelled')
  );

-- 4. Auto-Creation Trigger on auth.users
-- Automatically extracts full_name, phone (normalized to 10-digit 0XXXXXXXXX),
-- nic, bike model, and vehicle plate from user metadata.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_raw_phone text;
  v_clean_phone text;
  v_full_name text;
  v_nic text;
  v_bike_model text;
  v_vehicle_plate text;
  v_role text;
begin
  -- Normalize phone (stripping +94 or 94 to enforce 10-digit local format)
  v_raw_phone := nullif(trim(coalesce(new.raw_user_meta_data->>'phone', new.phone, '')), '');
  if v_raw_phone is not null then
    v_clean_phone := regexp_replace(v_raw_phone, '[[:space:]-]', '', 'g');
    if v_clean_phone like '+94%' then
      v_clean_phone := '0' || substr(v_clean_phone, 4);
    elsif v_clean_phone like '94%' and length(v_clean_phone) = 11 then
      v_clean_phone := '0' || substr(v_clean_phone, 3);
    end if;
  else
    v_clean_phone := null;
  end if;

  -- Extract name
  v_full_name := nullif(trim(coalesce(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    ''
  )), '');

  -- Extract NIC
  v_nic := nullif(upper(trim(coalesce(new.raw_user_meta_data->>'nic', ''))), '');

  -- Extract bike model & vehicle plate
  v_bike_model := nullif(trim(coalesce(
    new.raw_user_meta_data->>'bikeModel',
    new.raw_user_meta_data->>'bike_model',
    new.raw_user_meta_data->>'default_bike_model',
    ''
  )), '');

  v_vehicle_plate := nullif(upper(trim(coalesce(
    new.raw_user_meta_data->>'vehicleNo',
    new.raw_user_meta_data->>'vehicle_no',
    new.raw_user_meta_data->>'default_vehicle_plate',
    ''
  ))), '');

  -- Determine role (check app_metadata for 'admin', default to 'customer')
  if coalesce(new.raw_app_meta_data->>'role', '') = 'admin' then
    v_role := 'admin';
  else
    v_role := 'customer';
  end if;

  insert into public.profiles (
    id,
    full_name,
    phone,
    nic,
    role,
    default_bike_model,
    default_vehicle_plate,
    created_at,
    updated_at
  ) values (
    new.id,
    v_full_name,
    v_clean_phone,
    v_nic,
    v_role,
    v_bike_model,
    v_vehicle_plate,
    now(),
    now()
  )
  on conflict (id) do update set
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    phone = coalesce(excluded.phone, public.profiles.phone),
    nic = coalesce(excluded.nic, public.profiles.nic),
    default_bike_model = coalesce(excluded.default_bike_model, public.profiles.default_bike_model),
    default_vehicle_plate = coalesce(excluded.default_vehicle_plate, public.profiles.default_vehicle_plate),
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_create_profile on auth.users;
create trigger on_auth_user_created_create_profile
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 5. One-Time Data Migration & Backfill
-- Migrate all existing users in auth.users into public.profiles
insert into public.profiles (
  id,
  full_name,
  phone,
  nic,
  role,
  default_bike_model,
  default_vehicle_plate,
  created_at,
  updated_at
)
select
  u.id,
  nullif(trim(coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', '')), '') as full_name,
  case
    when (coalesce(u.raw_user_meta_data->>'phone', u.phone)) like '+94%'
      then '0' || substr(regexp_replace(coalesce(u.raw_user_meta_data->>'phone', u.phone), '[[:space:]-]', '', 'g'), 4)
    when (coalesce(u.raw_user_meta_data->>'phone', u.phone)) like '94%' and length(regexp_replace(coalesce(u.raw_user_meta_data->>'phone', u.phone), '[[:space:]-]', '', 'g')) = 11
      then '0' || substr(regexp_replace(coalesce(u.raw_user_meta_data->>'phone', u.phone), '[[:space:]-]', '', 'g'), 3)
    else nullif(trim(regexp_replace(coalesce(u.raw_user_meta_data->>'phone', u.phone, ''), '[[:space:]-]', '', 'g')), '')
  end as phone,
  nullif(upper(trim(coalesce(u.raw_user_meta_data->>'nic', ''))), '') as nic,
  case
    when coalesce(u.raw_app_meta_data->>'role', '') = 'admin' then 'admin'
    else 'customer'
  end as role,
  nullif(trim(coalesce(u.raw_user_meta_data->>'bikeModel', u.raw_user_meta_data->>'bike_model', u.raw_user_meta_data->>'default_bike_model', '')), '') as default_bike_model,
  nullif(upper(trim(coalesce(u.raw_user_meta_data->>'vehicleNo', u.raw_user_meta_data->>'vehicle_no', u.raw_user_meta_data->>'default_vehicle_plate', ''))), '') as default_vehicle_plate,
  coalesce(u.created_at, now()) as created_at,
  now() as updated_at
from auth.users u
on conflict (id) do nothing;

-- Explicitly update any admin users in profiles
update public.profiles
   set role = 'admin'
 where id in (
   select id from auth.users
   where coalesce(raw_app_meta_data->>'role', '') = 'admin'
 );

-- 6. Foreign Key Integrity with public.bookings
-- Ensure orphaned user_ids (if any) are safely set to null before applying FK constraint
update public.bookings
   set user_id = null
 where user_id is not null
   and user_id not in (select id from public.profiles);

-- Add foreign key constraint to public.profiles(id) so PostgREST can resolve joins
do $$
begin
  if not exists (
    select 1
    from information_schema.table_constraints
    where constraint_name = 'bookings_user_id_profiles_fkey'
      and table_schema = 'public'
      and table_name = 'bookings'
  ) then
    alter table public.bookings
      add constraint bookings_user_id_profiles_fkey
      foreign key (user_id)
      references public.profiles(id)
      on delete set null;
  end if;
end $$;

-- ============================================================================
-- 7. Fix Duplicate Booking & Token Collision for Cancelled / Rebooked Tokens
-- Replaces table-level unique constraints with partial indexes (status <> 'Cancelled')
-- and updates create_booking_transaction to find the lowest available token slot (1..12).
-- ============================================================================

-- Drop restrictive constraints that block re-booking cancelled vehicles/tokens
alter table public.bookings drop constraint if exists bookings_date_vehicle_unique;
alter table public.bookings drop constraint if exists bookings_date_token_unique;

-- Create partial unique indexes so cancelled slots do not trigger duplicate errors
drop index if exists bookings_date_vehicle_active_idx;
create unique index if not exists bookings_date_vehicle_active_idx
  on public.bookings (date, upper(trim(vehicle_no)))
  where status <> 'Cancelled';

drop index if exists bookings_date_token_active_idx;
create unique index if not exists bookings_date_token_active_idx
  on public.bookings (date, token_no)
  where status <> 'Cancelled';

-- Replace create_booking_transaction to robustly allocate tokens
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

  -- Check if vehicle is already booked with active status on this date
  if exists (
    select 1 from public.bookings
     where date = p_date
       and upper(trim(vehicle_no)) = upper(trim(p_vehicle_no))
       and status <> 'Cancelled'
  ) then
    raise exception 'DUPLICATE_BOOKING';
  end if;

  select count(*) filter (where status <> 'Cancelled'),
         count(*) filter (where service_type = 'Free Service' and status <> 'Cancelled'),
         count(*) filter (where service_type in ('Full Service', 'Normal Service') and status <> 'Cancelled')
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

  -- Determine next token number:
  -- Prefer issuing the next sequential token (e.g. 6, 7...) up to 12.
  select coalesce(max(token_no), 0) + 1 into next_token
    from public.bookings
   where date = p_date;

  -- If all 12 sequential numbers were reached, pick the lowest available vacated slot
  if next_token > 12 then
    select s.token into next_token
      from generate_series(1, 12) as s(token)
     where not exists (
       select 1 from public.bookings b
        where b.date = p_date
          and b.token_no = s.token
          and b.status <> 'Cancelled'
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

