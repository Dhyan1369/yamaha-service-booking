-- ============================================================================
-- Migration: 004_gallery_setup.sql
-- Description:
-- 1. Create public Supabase Storage bucket 'gallery' for workshop photos.
-- 2. Configure Storage RLS policies (public SELECT, admin-only INSERT/UPDATE/DELETE).
-- 3. Create public.gallery_photos table with display order and bilingual captions.
-- 4. Configure Table RLS policies (public SELECT, admin-only mutations).
-- 5. Seed with default authorized Yamaha workshop photos.
-- ============================================================================

-- ============================================================================
-- 1. Create Storage Bucket
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'gallery',
  'gallery',
  true,
  5242880, -- 5 MB limit
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

-- Storage Object Policies
drop policy if exists "Public Gallery Objects Select" on storage.objects;
create policy "Public Gallery Objects Select"
  on storage.objects
  for select
  using (bucket_id = 'gallery');

drop policy if exists "Admin Gallery Objects Insert" on storage.objects;
create policy "Admin Gallery Objects Insert"
  on storage.objects
  for insert
  with check (
    bucket_id = 'gallery' and public.is_admin()
  );

drop policy if exists "Admin Gallery Objects Update" on storage.objects;
create policy "Admin Gallery Objects Update"
  on storage.objects
  for update
  using (
    bucket_id = 'gallery' and public.is_admin()
  );

drop policy if exists "Admin Gallery Objects Delete" on storage.objects;
create policy "Admin Gallery Objects Delete"
  on storage.objects
  for delete
  using (
    bucket_id = 'gallery' and public.is_admin()
  );

-- ============================================================================
-- 2. Create public.gallery_photos Table
-- ============================================================================

create table if not exists public.gallery_photos (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  storage_path text not null default '',
  title_en text,
  title_si text,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Trigger for updated_at
create or replace function public.handle_gallery_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_gallery_photos_updated on public.gallery_photos;
create trigger on_gallery_photos_updated
  before update on public.gallery_photos
  for each row execute function public.handle_gallery_updated_at();

-- Indexes for performance
create index if not exists idx_gallery_photos_order on public.gallery_photos(display_order, created_at);

-- ============================================================================
-- 3. Table Row Level Security (RLS)
-- ============================================================================

alter table public.gallery_photos enable row level security;

-- Public read access
drop policy if exists "Allow public select on gallery_photos" on public.gallery_photos;
create policy "Allow public select on gallery_photos"
  on public.gallery_photos
  for select
  using (true);

-- Admin insert access
drop policy if exists "Allow admin insert on gallery_photos" on public.gallery_photos;
create policy "Allow admin insert on gallery_photos"
  on public.gallery_photos
  for insert
  with check (public.is_admin());

-- Admin update access
drop policy if exists "Allow admin update on gallery_photos" on public.gallery_photos;
create policy "Allow admin update on gallery_photos"
  on public.gallery_photos
  for update
  using (public.is_admin());

-- Admin delete access
drop policy if exists "Allow admin delete on gallery_photos" on public.gallery_photos;
create policy "Allow admin delete on gallery_photos"
  on public.gallery_photos
  for delete
  using (public.is_admin());

-- Grant permissions to anon and authenticated
grant select on public.gallery_photos to anon, authenticated;
grant all on public.gallery_photos to authenticated;

-- ============================================================================
-- 4. Initial Seed Data (Curated Yamaha Authorized Workshop Imagery)
-- ============================================================================

insert into public.gallery_photos (id, image_url, storage_path, title_en, title_si, display_order)
values
  (
    '00000000-0000-0000-0000-000000000001',
    'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1200&q=80',
    'seed/workshop_main.jpg',
    'Modern Hydraulic Service Bays & Diagnostic Area',
    'නවීන හයිඩ්‍රොලික් සේවා බේ සහ පරිගණක පරීක්ෂණ අංශය',
    1
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=1200&q=80',
    'seed/diagnostics.jpg',
    'Yamaha Certified Computerized Diagnostics (YDT)',
    'යමහා සහතිකලත් පරිගණක දෝෂ හඳුනාගැනීමේ පද්ධතිය',
    2
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1200&q=80',
    'seed/yamalube.jpg',
    '100% Genuine Yamalube Oils & Factory Spare Parts',
    '100% අව්‍යාජ යමලූබ් ලිහිසි තෙල් සහ කර්මාන්තශාලා අමතර කොටස්',
    3
  ),
  (
    '00000000-0000-0000-0000-000000000004',
    'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=1200&q=80',
    'seed/precision_care.jpg',
    'High-Precision Engine Overhaul & Periodic Tune-Up',
    'ඉහළ නිරවද්‍යතා එන්ජින් පරීක්ෂාව සහ කාලීන නඩත්තු සේවාව',
    4
  )
on conflict (id) do nothing;
