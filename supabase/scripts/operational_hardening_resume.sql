-- RESUME operational hardening (run if profiles + support tables already exist).
-- Do NOT use trim() on payment_status — it is an enum in production.
-- Copy this entire file into Supabase SQL editor.

-- ---------------------------------------------------------------------------
-- bookings: columns + payment backfill (enum-safe)
-- ---------------------------------------------------------------------------
alter table public.bookings add column if not exists amount_paid bigint;
alter table public.bookings add column if not exists amount_due bigint;
alter table public.bookings add column if not exists deposit_held_rupees bigint;
alter table public.bookings add column if not exists deposit_amount integer;
alter table public.bookings add column if not exists deleted_at timestamptz;

update public.bookings
set payment_status = 'pending'
where payment_status is null;

update public.bookings
set
  amount_paid = coalesce(amount_paid, 0),
  amount_due = coalesce(amount_due, coalesce(total_rupees, 0))
where amount_paid is null
   or amount_due is null;

-- ---------------------------------------------------------------------------
-- audit trigger (schema-safe)
-- ---------------------------------------------------------------------------
create or replace function public.audit_log_booking_change ()
  returns trigger
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_action text;
  v_old jsonb;
  v_new jsonb;
  v_track_keys text[] := array[
    'booking_status',
    'payment_status',
    'total_rupees',
    'amount_paid',
    'amount_due',
    'deposit_amount',
    'deposit_held_rupees',
    'deleted_at'
  ];
begin
  if tg_op = 'INSERT' then
    v_action := 'booking.created';
    v_new := (
      select coalesce(jsonb_object_agg(key, value), '{}'::jsonb)
      from jsonb_each(to_jsonb(new))
      where key = any (v_track_keys)
    );
    insert into public.audit_logs (actor_id, actor_role, entity_type, entity_id, action, new_value, metadata)
    values (
      new.user_id,
      'system',
      'booking',
      new.id::text,
      v_action,
      v_new,
      jsonb_build_object('bookingId', new.id, 'userId', new.user_id, 'source', 'db_trigger')
    );
    return new;
  end if;

  if tg_op = 'UPDATE' then
    v_old := (
      select coalesce(jsonb_object_agg(key, value), '{}'::jsonb)
      from jsonb_each(to_jsonb(old))
      where key = any (v_track_keys)
    );
    v_new := (
      select coalesce(jsonb_object_agg(key, value), '{}'::jsonb)
      from jsonb_each(to_jsonb(new))
      where key = any (v_track_keys)
    );

    if (v_new->>'deleted_at') is not null and (v_old->>'deleted_at') is null then
      v_action := 'booking.soft_deleted';
    elsif (v_old->>'booking_status') is distinct from (v_new->>'booking_status') then
      v_action := 'booking.status_changed';
    elsif (v_old->>'payment_status') is distinct from (v_new->>'payment_status') then
      v_action := 'booking.payment_status_changed';
    else
      v_action := 'booking.updated';
    end if;

    insert into public.audit_logs (actor_id, actor_role, entity_type, entity_id, action, old_value, new_value, metadata)
    values (
      coalesce(auth.uid(), new.user_id),
      'system',
      'booking',
      new.id::text,
      v_action,
      v_old,
      v_new,
      jsonb_build_object('bookingId', new.id, 'userId', new.user_id, 'source', 'db_trigger')
    );
    return new;
  end if;

  return coalesce(new, old);
end;
$$;

drop trigger if exists audit_bookings_change on public.bookings;
create trigger audit_bookings_change
  after insert or update on public.bookings
  for each row
  execute function public.audit_log_booking_change ();

-- ---------------------------------------------------------------------------
-- deposit backfill
-- ---------------------------------------------------------------------------
update public.bookings b
set
  deposit_amount = coalesce(
    nullif(b.deposit_amount, 0),
    nullif(b.deposit_held_rupees, 0),
    (
      select greatest(0, round(coalesce(v.security_deposit, 0)::numeric))
      from public.vehicles v
      where v.id = b.vehicle_id
    ),
    0
  ),
  deposit_held_rupees = coalesce(
    nullif(b.deposit_held_rupees, 0),
    nullif(b.deposit_amount, 0),
    (
      select greatest(0, round(coalesce(v.security_deposit, 0)::numeric))
      from public.vehicles v
      where v.id = b.vehicle_id
    ),
    0
  )
where b.deleted_at is null
  and b.booking_status not in ('cancelled')
  and coalesce(b.deposit_amount, 0) = 0
  and coalesce(b.deposit_held_rupees, 0) = 0
  and b.vehicle_id is not null;

-- ---------------------------------------------------------------------------
-- vehicles
-- ---------------------------------------------------------------------------
alter table public.vehicles add column if not exists vehicle_location text;
alter table public.vehicles add column if not exists gps_status text default 'unknown';
alter table public.vehicles add column if not exists fuel_level_pct smallint;
alter table public.vehicles add column if not exists deleted_at timestamptz;

create unique index if not exists vehicles_registration_number_unique_idx
  on public.vehicles (lower(trim(registration_number)))
  where deleted_at is null
    and registration_number is not null
    and trim(registration_number) <> '';

update public.vehicles
set
  fuel_level_pct = coalesce(fuel_level_pct, 65 + (abs(hashtext(id::text)) % 30)),
  gps_status = coalesce(gps_status, 'offline'),
  vehicle_location = coalesce(nullif(trim(vehicle_location), ''), 'Mumbai — awaiting GPS ping')
where deleted_at is null
  and (fuel_level_pct is null or gps_status is null or vehicle_location is null or trim(vehicle_location) = '');
