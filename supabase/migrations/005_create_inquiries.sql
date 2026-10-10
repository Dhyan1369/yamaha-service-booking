-- ============================================================================
-- Migration: 005_create_inquiries.sql
-- Description:
-- 1. Create public.inquiries table for customer contact form submissions.
-- 2. Enforce strict anti-spam & data-integrity constraints on DB level.
-- 3. Blind Drop-Box Row Level Security (RLS):
--    - Public & Anon can INSERT (with message length & 10-digit phone regex check)
--    - Strictly Admin ONLY can SELECT, UPDATE, or DELETE (protecting customer privacy)
-- ============================================================================

create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  name varchar(80) not null,
  phone varchar(15) not null,
  bike_model varchar(60) default 'Yamaha Two-Wheeler',
  message varchar(500) not null,
  status varchar(20) not null default 'new' check (status in ('new', 'replied', 'archived')),
  admin_notes text default null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint inquiry_message_length check (char_length(trim(message)) >= 5 and char_length(message) <= 500),
  constraint inquiry_phone_format check (phone ~ '^0[0-9]{9}$')
);

-- Index for admin sorting and filtering by status and date
create index if not exists idx_inquiries_status_created on public.inquiries(status, created_at desc);
create index if not exists idx_inquiries_phone on public.inquiries(phone);

-- Enable Row Level Security
alter table public.inquiries enable row level security;

-- Drop existing policies if re-running
drop policy if exists "Public and anon can drop inquiries" on public.inquiries;
drop policy if exists "Admins can manage inquiries" on public.inquiries;
drop policy if exists "Admins can select inquiries" on public.inquiries;
drop policy if exists "Admins can update inquiries" on public.inquiries;
drop policy if exists "Admins can delete inquiries" on public.inquiries;

-- 1. INSERT Policy (Blind drop box for public & anon visitors)
-- Customer can insert their message, but can never read anyone else's or their own via SELECT
create policy "Public and anon can drop inquiries"
  on public.inquiries
  for insert
  to anon, authenticated
  with check (
    char_length(trim(message)) >= 5
    and char_length(message) <= 500
    and phone ~ '^0[0-9]{9}$'
  );

-- 2. ALL Policy (Admin Only Management)
-- Only verified workshop admins can view, update status, or delete inquiries
create policy "Admins can manage inquiries"
  on public.inquiries
  for all
  to authenticated
  using (
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
    or exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  )
  with check (
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
    or exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- Grants
grant insert on public.inquiries to anon, authenticated;
grant select, update, delete on public.inquiries to authenticated;
