-- Optional hub / garage city for fleet catalog and admin filtering.
alter table public.vehicles
  add column if not exists city text;

comment on column public.vehicles.city is 'Optional city or hub label for catalog and ops (e.g. Mumbai, BKC).';
