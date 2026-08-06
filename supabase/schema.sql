-- BAND Hub (multi-user)
-- Run in Supabase SQL Editor (can replace older single-tenant schema)

create extension if not exists pgcrypto;

create table if not exists public.pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  pin_hash text not null,
  display_name text not null default 'ㅇㅇ',
  handle text not null default '@account',
  tagline text not null default '밴드 역계 백업용 페이지입니다.',
  extra_note text not null default '',
  notice text not null default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.contacts (
  page_id uuid primary key references public.pages(id) on delete cascade,
  main text not null default '',
  sub text not null default '',
  other text not null default '',
  updated_at timestamptz default now()
);

create table if not exists public.bands (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.pages(id) on delete cascade,
  category text not null check (category in ('the_cast', 'solar_c')),
  band_name text not null default '',
  face_name text not null default '',
  handle text not null default '',
  cover_path text,
  face_path text,
  sort_order int not null default 0,
  created_at timestamptz default now()
);

create index if not exists bands_page_id_idx on public.bands(page_id);
create index if not exists pages_slug_idx on public.pages(slug);

alter table public.pages enable row level security;
alter table public.contacts enable row level security;
alter table public.bands enable row level security;

-- Personal hub MVP: public read/write (PIN only gates the edit UI).
drop policy if exists "pages read" on public.pages;
drop policy if exists "pages write" on public.pages;
create policy "pages read" on public.pages for select using (true);
create policy "pages write" on public.pages for all using (true) with check (true);

drop policy if exists "contacts read" on public.contacts;
drop policy if exists "contacts write" on public.contacts;
create policy "contacts read" on public.contacts for select using (true);
create policy "contacts write" on public.contacts for all using (true) with check (true);

drop policy if exists "bands read" on public.bands;
drop policy if exists "bands write" on public.bands;
create policy "bands read" on public.bands for select using (true);
create policy "bands write" on public.bands for all using (true) with check (true);

insert into storage.buckets (id, name, public)
values ('band-images', 'band-images', true)
on conflict (id) do update set public = true;

drop policy if exists "band images read" on storage.objects;
drop policy if exists "band images write" on storage.objects;
create policy "band images read"
  on storage.objects for select
  using (bucket_id = 'band-images');
create policy "band images write"
  on storage.objects for all
  using (bucket_id = 'band-images')
  with check (bucket_id = 'band-images');
