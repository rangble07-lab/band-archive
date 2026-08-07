-- Allow SOLAR-C 1st category + keep theme columns
alter table public.pages add column if not exists accent_color text not null default '#8B6F5C';
alter table public.pages add column if not exists bg_color text not null default '#F7F5F2';
alter table public.pages add column if not exists text_color text not null default '#1A1A1A';

alter table public.bands drop constraint if exists bands_category_check;
alter table public.bands
  add constraint bands_category_check
  check (category in ('the_cast', 'solar_c', 'solar_c_1st'));
