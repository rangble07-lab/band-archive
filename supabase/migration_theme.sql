-- Run once on existing BAND Hub projects
alter table public.pages add column if not exists accent_color text not null default '#8B6F5C';
alter table public.pages add column if not exists bg_color text not null default '#F7F5F2';
alter table public.pages add column if not exists text_color text not null default '#1A1A1A';
