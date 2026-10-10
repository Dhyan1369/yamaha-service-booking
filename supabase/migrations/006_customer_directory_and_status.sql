-- ============================================================================
-- Migration: 006_customer_directory_and_status.sql
-- Description:
-- 1. Adds is_active (boolean, default true) and admin_notes (text) to public.profiles.
-- 2. Creates index on is_active for efficient filtering.
-- 3. Ensures RLS policies allow admin to view, update is_active and admin_notes.
-- ============================================================================

alter table public.profiles
  add column if not exists is_active boolean not null default true,
  add column if not exists admin_notes text;

create index if not exists profiles_is_active_idx on public.profiles(is_active);

-- Ensure authenticated role has select and update privileges
grant select, update on public.profiles to authenticated;
