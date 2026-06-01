-- Customer booking gallery: multiple fleet-bucket images per catalog vehicle.

alter table public.vehicles
  add column if not exists gallery_images jsonb not null default '[]'::jsonb;

comment on column public.vehicles.gallery_images is
  'Array of {path, label} objects — paths in public fleet bucket; labels e.g. exterior, interior, dashboard.';
