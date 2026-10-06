-- Booking security and atomic allocation for Supabase.
-- Apply this migration in the Supabase SQL editor before enabling production bookings.

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  token_no integer not null,
  time_slot text not null,
  name text not null,
  phone text not null,
  nic text not null,
  bike_model text not null,
  vehicle_no text not null,
  service_type text not null,
  status text not null default 'Pending',
  date date not null,
  user_id uuid references auth.users(id),
  created_at timestamptz not null default now(),
  constraint bookings_service_type_check check (service_type in ('Free Service', 'Full Service', 'Normal Service')),
  constraint bookings_status_check check (status in ('Pending', 'In-Service', 'Completed', 'Cancelled')),
  constraint bookings_token_check check (token_no between 1 and 12),
  constraint bookings_phone_check check (phone ~ '^0[0-9]{9}$'),
  constraint bookings_date_token_unique unique (date, token_no),
  constraint bookings_date_vehicle_unique unique (date, vehicle_no)
);

-- Ensure mileage column exists if table already existed prior to migration
alter table public.bookings add column if not exists mileage text;

create index if not exists bookings_user_id_idx on public.bookings(user_id);
create index if not exists bookings_date_idx on public.bookings(date);

alter table public.bookings enable row level security;

revoke all on public.bookings from anon, authenticated;
grant select on public.bookings to authenticated;

drop policy if exists bookings_select_policy on public.bookings;
create policy bookings_select_policy on public.bookings
  for select to authenticated
  using (
    user_id = auth.uid()
    or coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin'
  );

drop policy if exists bookings_admin_update_policy on public.bookings;
create policy bookings_admin_update_policy on public.bookings
  for update to authenticated
  using (coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin')
  with check (coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin');

-- Drop existing functions first if return types or signatures changed
drop function if exists public.get_booking_availability(date);
drop function if exists public.get_booking_availability;

create or replace function public.get_booking_availability(p_date date)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  total_booked integer;
  free_services integer;
  standard_services integer;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select count(*) filter (where status <> 'Cancelled'),
         count(*) filter (where service_type = 'Free Service' and status <> 'Cancelled'),
         count(*) filter (where service_type in ('Full Service', 'Normal Service') and status <> 'Cancelled')
    into total_booked, free_services, standard_services
    from public.bookings
   where date = p_date;

  return jsonb_build_object(
    'totalBooked', total_booked,
    'freeServices', free_services,
    'standardServices', standard_services,
    'availableSlots', greatest(0, 12 - total_booked),
    'availableFreeSlots', greatest(0, 5 - free_services),
    'availableStandardSlots', greatest(0, 7 - standard_services),
    'maxDailySlots', 12,
    'maxFreeServices', 5,
    'maxStandardServices', 7
  );
end;
$$;

grant execute on function public.get_booking_availability(date) to authenticated;

-- Drop existing function to avoid ERROR 42P13 (cannot change return type of existing function)
drop function if exists public.create_booking_transaction(date, text, text, text, text, text, text, uuid);
drop function if exists public.create_booking_transaction;

create or replace function public.create_booking_transaction(
  p_date date,
  p_name text,
  p_phone text,
  p_nic text,
  p_bike_model text,
  p_vehicle_no text,
  p_service_type text,
  p_user_id uuid default null
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
  is_admin boolean := coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin';
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

  next_token := total_booked + 1;

  insert into public.bookings (
    token_no, time_slot, name, phone, nic, bike_model, vehicle_no,
    service_type, status, date, user_id
  ) values (
    next_token,
    to_char((time '08:30' + ((next_token - 1) * interval '45 minutes'))::time, 'HH12:MI AM'),
    trim(p_name), regexp_replace(p_phone, '[[:space:]-]', '', 'g'), upper(trim(coalesce(p_nic, 'N/A'))),
    trim(p_bike_model), upper(trim(p_vehicle_no)), p_service_type, 'Pending', p_date, booking_user_id
  ) returning * into created_booking;

  return created_booking;
exception
  when unique_violation then
    raise exception 'DUPLICATE_BOOKING';
end;
$$;

revoke all on function public.create_booking_transaction(date, text, text, text, text, text, text, uuid) from public, anon;
grant execute on function public.create_booking_transaction(date, text, text, text, text, text, text, uuid) to authenticated;

-- ============================================================================
-- Auto-sync Phone & Email on auth.users
-- Automatically sets auth.users.phone from user_metadata so the 'Phone' column
-- in Supabase Auth dashboard is properly populated instead of showing '-'
-- ============================================================================

create or replace function public.sync_auth_user_phone()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_phone text;
  v_email text;
begin
  v_phone := nullif(trim(coalesce(new.raw_user_meta_data->>'phone', '')), '');
  v_email := nullif(trim(coalesce(new.raw_user_meta_data->>'email', '')), '');

  -- 1. Populate the Phone column in auth.users exactly as entered (0XXXXXXXXX, no +94)
  if v_phone is not null then
    -- Strip +94 prefix if present so phone is always stored in local 0XXXXXXXXX format
    if v_phone like '+94%' then
      v_phone := '0' || substr(v_phone, 4);
    end if;

    -- Set phone only if it is not already used by another user (avoids duplicate key error 23505)
    if not exists (
      select 1 from auth.users 
       where phone = v_phone 
         and id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid)
    ) then
      new.phone := v_phone;
      new.phone_confirmed_at := coalesce(new.phone_confirmed_at, now());
    end if;
  end if;

  -- 2. Populate the Email column with real email if provided
  if v_email is not null and v_email <> '' and v_email like '%@%' then
    new.email := trim(lower(v_email));
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_sync_phone on auth.users;
create trigger on_auth_user_created_sync_phone
  before insert or update on auth.users
  for each row execute function public.sync_auth_user_phone();

-- Convert any existing phone numbers starting with +94 to local 0XXXXXXXXX format
update auth.users
   set phone = '0' || substr(phone, 4)
 where phone like '+94%'
   and not exists (
     select 1 from auth.users u2
      where u2.phone = '0' || substr(auth.users.phone, 4)
        and u2.id <> auth.users.id
   );

-- Convert any existing raw_user_meta_data phones starting with +94 to local 0XXXXXXXXX format
update auth.users
   set raw_user_meta_data = jsonb_set(
         raw_user_meta_data, 
         '{phone}', 
         to_jsonb('0' || substr(raw_user_meta_data->>'phone', 4))
       )
 where raw_user_meta_data->>'phone' like '+94%';

-- Populate phone for existing registered users without +94 (safe from duplicate key error)
with ranked_users as (
  select id,
         case 
           when (raw_user_meta_data->>'phone') like '+94%' then '0' || substr(raw_user_meta_data->>'phone', 4)
           else raw_user_meta_data->>'phone'
         end as formatted_phone,
         row_number() over (
           partition by case 
             when (raw_user_meta_data->>'phone') like '+94%' then '0' || substr(raw_user_meta_data->>'phone', 4)
             else raw_user_meta_data->>'phone'
           end 
           order by created_at desc
         ) as rn
    from auth.users
   where raw_user_meta_data->>'phone' is not null
     and (phone is null or phone = '')
)
update auth.users u
   set phone = r.formatted_phone,
       phone_confirmed_at = coalesce(u.phone_confirmed_at, now())
  from ranked_users r
 where u.id = r.id
   and r.rn = 1
   and not exists (
     select 1 from auth.users existing 
      where existing.phone = r.formatted_phone 
        and existing.id <> r.id
   );

-- Lookup email by phone number to allow login using phone when real email was registered
drop function if exists public.get_email_by_phone(text);
drop function if exists public.get_email_by_phone;

create or replace function public.get_email_by_phone(p_phone text)
returns text
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_clean text;
  v_found_email text;
begin
  v_clean := regexp_replace(p_phone, '[^0-9]', '', 'g');
  if length(v_clean) >= 9 then
    v_clean := right(v_clean, 9);
  end if;

  select email into v_found_email
    from auth.users
   where regexp_replace(coalesce(phone, ''), '[^0-9]', '', 'g') like '%' || v_clean
      or regexp_replace(coalesce(raw_user_meta_data->>'phone', ''), '[^0-9]', '', 'g') like '%' || v_clean
   limit 1;

  return v_found_email;
end;
$$;

grant execute on function public.get_email_by_phone(text) to anon, authenticated;

