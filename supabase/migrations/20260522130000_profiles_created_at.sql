-- Profile creation timestamp for analytics (backfilled from updated_at).
alter table public.profiles add column if not exists created_at timestamptz;

update public.profiles
set created_at = coalesce(created_at, updated_at)
where created_at is null;

alter table public.profiles alter column created_at set default now();

-- Not null after backfill; new rows get default now().
alter table public.profiles alter column created_at set not null;

comment on column public.profiles.created_at is 'Approximate account creation time; backfilled from updated_at where unknown.';
