-- ============================================================================
-- Migration: 004_walk_in_support.sql
-- Description:
-- 1. Alter public.bookings:
--    - Make user_id nullable for guest / unregistered walk-in customers.
--    - Add audit columns: is_walk_in, created_by, customer_notes.
-- 2. Update create_booking_transaction RPC:
--    - Accept customer snapshot parameters + audit fields (is_walk_in, created_by, customer_notes).
--    - Support both p_date and p_booking_date, p_name and p_customer_name for strict backward-compatibility.
--    - Enforce pg_advisory_xact_lock on booking date.
--    - Strict quota enforcement: 12 daily maximum, 5 Free Service max, 7 Standard (Full + Normal) max.
--    - Enforce active vehicle check (status != 'cancelled').
--    - Store customer snapshot data without forcing admin's auth identity onto user_id.
--    - If caller is admin: store provided p_user_id (if registered) or NULL (if guest), and created_by = admin auth.uid().
--    - If caller is standard customer: enforce user_id = auth.uid(), is_walk_in = false.
-- 3. Retroactive Account Linkage Trigger:
--    - When an unregistered customer later creates an online account / updates profile
--      with their 10-digit phone number, automatically update any past walk-in bookings
--      (WHERE phone = NEW.phone AND user_id IS NULL) with user_id = NEW.id.
-- ============================================================================

-- 1. Schema Alterations on public.bookings
alter table public.bookings alter column user_id drop not null;

alter table public.bookings add column if not exists is_walk_in boolean default false;
alter table public.bookings add column if not exists created_by uuid references auth.users(id) on delete set null;
alter table public.bookings add column if not exists customer_notes text;

-- Indexes for performance
create index if not exists bookings_user_id_idx on public.bookings(user_id);
create index if not exists bookings_created_by_idx on public.bookings(created_by);
create index if not exists bookings_is_walk_in_idx on public.bookings(is_walk_in);
create index if not exists bookings_phone_idx on public.bookings(phone);

-- Ensure RLS on public.bookings allows admins to select and update all bookings
-- and customers to select their own bookings (user_id = auth.uid())
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

-- 2. Drop prior signatures of create_booking_transaction to avoid parameter ambiguity
drop function if exists public.create_booking_transaction(date, text, text, text, text, text, text, uuid);
drop function if exists public.create_booking_transaction(date, text, text, text, text, text, text, uuid, text);
drop function if exists public.create_booking_transaction;

-- Create updated create_booking_transaction RPC
create or replace function public.create_booking_transaction(
  p_date date default null,
  p_name text default null,
  p_phone text default null,
  p_nic text default null,
  p_bike_model text default null,
  p_vehicle_no text default null,
  p_service_type text default null,
  p_user_id uuid default null,
  p_mileage text default null,
  p_customer_notes text default null,
  p_is_walk_in boolean default false,
  p_created_by uuid default null,
  p_booking_date date default null,
  p_customer_name text default null
)
returns public.bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_date date;
  v_name text;
  v_phone text;
  v_is_admin boolean;
  booking_user_id uuid;
  v_created_by uuid;
  total_booked integer;
  free_services integer;
  standard_services integer;
  next_token integer;
  created_booking public.bookings;
begin
  -- Resolve parameter aliases (supports p_date / p_booking_date, p_name / p_customer_name)
  v_date := coalesce(p_date, p_booking_date);
  v_name := trim(coalesce(p_name, p_customer_name, ''));

  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if v_date is null then
    raise exception 'INVALID_BOOKING_DATE';
  end if;

  v_is_admin := public.is_admin();

  -- Normalize phone (enforce 10-digit Sri Lankan mobile starting with 0)
  v_phone := regexp_replace(coalesce(p_phone, ''), '[[:space:]-]', '', 'g');
  if v_phone like '+94%' then
    v_phone := '0' || substr(v_phone, 4);
  elsif v_phone like '94%' and length(v_phone) = 11 then
    v_phone := '0' || substr(v_phone, 3);
  end if;

  -- Validate fields
  if length(v_name) = 0
     or p_bike_model is null or length(trim(p_bike_model)) = 0
     or p_vehicle_no is null or length(trim(p_vehicle_no)) = 0
     or v_phone !~ '^0[0-9]{9}$' then
    raise exception 'INVALID_BOOKING_DATA';
  end if;

  if p_service_type not in ('Free Service', 'Full Service', 'Normal Service') then
    raise exception 'INVALID_SERVICE_TYPE';
  end if;

  -- Date rules
  if not v_is_admin and v_date <= current_date then
    raise exception 'BOOKING_CLOSED_FOR_DATE';
  end if;
  if v_is_admin and v_date < current_date then
    raise exception 'PAST_DATE';
  end if;
  if extract(isodow from v_date) = 1 then
    raise exception 'CLOSED_DATE';
  end if;

  -- Determine user identity vs admin identity
  if v_is_admin then
    -- Admin is creating this booking (walk-in or on behalf of customer)
    -- User ID is set to customer's profile if linked, or NULL for unregistered guest
    booking_user_id := p_user_id;
    v_created_by := coalesce(p_created_by, auth.uid());
  else
    -- Online customer booking: strictly bind to the authenticated user's ID
    booking_user_id := auth.uid();
    v_created_by := auth.uid();
  end if;

  -- Strict transaction lock per booking date
  perform pg_advisory_xact_lock(hashtext(v_date::text));

  -- Check if vehicle already has an active (non-cancelled) booking on this date
  if exists (
    select 1 from public.bookings
     where date = v_date
       and upper(trim(vehicle_no)) = upper(trim(p_vehicle_no))
       and lower(status) != 'cancelled'
  ) then
    raise exception 'DUPLICATE_BOOKING';
  end if;

  -- Quota calculation (excluding cancelled bookings)
  select count(*) filter (where lower(status) != 'cancelled'),
         count(*) filter (where service_type = 'Free Service' and lower(status) != 'cancelled'),
         count(*) filter (where service_type in ('Full Service', 'Normal Service') and lower(status) != 'cancelled')
    into total_booked, free_services, standard_services
    from public.bookings
   where date = v_date;

  if total_booked >= 12 then
    raise exception 'SLOT_FULL';
  end if;
  if p_service_type = 'Free Service' and free_services >= 5 then
    raise exception 'FREE_SERVICE_FULL';
  end if;
  if p_service_type in ('Full Service', 'Normal Service') and standard_services >= 7 then
    raise exception 'STANDARD_SERVICE_FULL';
  end if;

  -- Determine next sequential token (1..12)
  select coalesce(max(token_no), 0) + 1 into next_token
    from public.bookings
   where date = v_date;

  -- If sequential count exceeded 12 (due to prior cancellations), allocate lowest free slot
  if next_token > 12 then
    select s.token into next_token
      from generate_series(1, 12) as s(token)
     where not exists (
       select 1 from public.bookings b
        where b.date = v_date
          and b.token_no = s.token
          and lower(b.status) != 'cancelled'
     )
     order by s.token
     limit 1;
  end if;

  if next_token is null or next_token > 12 then
    raise exception 'SLOT_FULL';
  end if;

  -- Insert booking record
  insert into public.bookings (
    token_no,
    time_slot,
    name,
    phone,
    nic,
    bike_model,
    mileage,
    vehicle_no,
    service_type,
    status,
    date,
    user_id,
    is_walk_in,
    created_by,
    customer_notes
  ) values (
    next_token,
    to_char((time '08:30' + ((next_token - 1) * interval '45 minutes'))::time, 'HH12:MI AM'),
    v_name,
    v_phone,
    upper(trim(coalesce(p_nic, 'N/A'))),
    trim(p_bike_model),
    nullif(trim(p_mileage), ''),
    upper(trim(p_vehicle_no)),
    p_service_type,
    'Pending',
    v_date,
    booking_user_id,
    coalesce(p_is_walk_in, false),
    v_created_by,
    nullif(trim(p_customer_notes), '')
  ) returning * into created_booking;

  return created_booking;
exception
  when unique_violation then
    raise exception 'DUPLICATE_BOOKING';
end;
$$;

revoke all on function public.create_booking_transaction from public, anon;
grant execute on function public.create_booking_transaction to authenticated;

-- 3. Retroactive Account Linkage Trigger
-- When an unregistered walk-in customer registers or updates their profile with
-- their phone number, retroactively link any unassigned bookings (user_id IS NULL).
create or replace function public.link_walk_in_bookings_to_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_clean_phone text;
begin
  if new.phone is not null then
    v_clean_phone := regexp_replace(new.phone, '[[:space:]-]', '', 'g');
    if v_clean_phone like '+94%' then
      v_clean_phone := '0' || substr(v_clean_phone, 4);
    elsif v_clean_phone like '94%' and length(v_clean_phone) = 11 then
      v_clean_phone := '0' || substr(v_clean_phone, 3);
    end if;

    if length(v_clean_phone) = 10 then
      update public.bookings
         set user_id = new.id
       where phone = v_clean_phone
         and user_id is null;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_link_walk_in_bookings on public.profiles;
create trigger trg_link_walk_in_bookings
  after insert or update of phone on public.profiles
  for each row
  execute function public.link_walk_in_bookings_to_profile();
