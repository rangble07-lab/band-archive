-- Create tables + storage for BAND archive
-- Run in Supabase SQL Editor

create table if not exists public.profile (
  id int primary key default 1 check (id = 1),
  display_name text not null default 'ㅇㅇ',
  handle text not null default '@account',
  tagline text not null default '밴드 역계 백업용 페이지입니다.',
  extra_note text not null default '',
  notice text not null default '',
  updated_at timestamptz default now()
);

create table if not exists public.contacts (
  id int primary key default 1 check (id = 1),
  main text not null default '',
  sub text not null default '',
  other text not null default '',
  updated_at timestamptz default now()
);

create table if not exists public.bands (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('the_cast', 'solar_c')),
  band_name text not null default '',
  face_name text not null default '',
  handle text not null default '',
  cover_path text,
  face_path text,
  sort_order int not null default 0,
  created_at timestamptz default now()
);

insert into public.profile (id) values (1) on conflict (id) do nothing;
insert into public.contacts (id) values (1) on conflict (id) do nothing;

alter table public.profile enable row level security;
alter table public.contacts enable row level security;
alter table public.bands enable row level security;

-- Personal archive MVP: public read + anon write (PIN only gates the UI).
-- Do not put sensitive secrets in this project beyond the edit PIN.

drop policy if exists "profile read" on public.profile;
drop policy if exists "profile write" on public.profile;
create policy "profile read" on public.profile for select using (true);
create policy "profile write" on public.profile for all using (true) with check (true);

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
