-- Boolean catalog flag used by the Next.js app (`vehicles.available`).
-- Safe if the column was created manually in production already.

alter table public.vehicles
  add column if not exists available boolean not null default true;

comment on column public.vehicles.available is 'When true, vehicle shows as Available and booking is enabled.';
