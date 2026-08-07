-- Band year + category constraint (run in Supabase SQL Editor)
alter table public.bands add column if not exists year int;

alter table public.bands drop constraint if exists bands_category_check;
alter table public.bands
  add constraint bands_category_check
  check (category in ('the_cast', 'solar_c', 'solar_c_1st'));
