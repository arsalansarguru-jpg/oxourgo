-- Production security hardening: staff RBAC in RLS, catalog-scoped public vehicle reads,
-- customer KYC delete for rollback paths, and optional staff read of KYC storage objects.
--
-- Application role is mirrored from `lib/auth/roles.ts`: JWT `app_metadata.oxour_role`
-- (fallback: legacy `app_metadata.role`). Staff = `ops_admin` | `super_admin`.
--
-- Note: There is no `reviews` table in this project; review counts are static/app data.

-- ---------------------------------------------------------------------------
-- JWT helpers (SECURITY INVOKER — no privilege escalation)
-- ---------------------------------------------------------------------------
create or replace function public.jwt_oxour_app_role ()
  returns text
  language sql
  stable
  security invoker
  set search_path = public
as $$
  select nullif(
    trim(
      coalesce(
        auth.jwt() -> 'app_metadata' ->> 'oxour_role',
        auth.jwt() -> 'app_metadata' ->> 'role',
        ''
      )
    ),
    ''
  );
$$;

create or replace function public.is_ops_staff ()
  returns boolean
  language sql
  stable
  security invoker
  set search_path = public
as $$
  select public.jwt_oxour_app_role () in ('ops_admin', 'super_admin');
$$;

revoke all on function public.jwt_oxour_app_role () from public;
revoke all on function public.is_ops_staff () from public;
grant execute on function public.jwt_oxour_app_role () to anon,
authenticated;
grant execute on function public.is_ops_staff () to anon,
authenticated;

comment on function public.jwt_oxour_app_role is 'Oxour Go app RBAC string from JWT app_metadata (oxour_role, else legacy role).';
comment on function public.is_ops_staff is 'True when JWT carries ops_admin or super_admin (see lib/auth/roles.ts).';

-- ---------------------------------------------------------------------------
-- vehicles: replace world-readable select with catalog-only + staff bypass
-- ---------------------------------------------------------------------------
drop policy if exists "vehicles_select_public" on public.vehicles;

-- Public fleet UX lists bookable and temporarily unavailable rows; `maintenance` is ops-only.
create policy "vehicles_select_catalog_or_staff" on public.vehicles for select using (
  public.is_ops_staff ()
  or coalesce(availability_status, 'available') in ('available', 'unavailable')
);

comment on policy "vehicles_select_catalog_or_staff" on public.vehicles is 'Public: catalog + unavailable listings; excludes maintenance. Staff: full inventory.';

-- Staff can manage catalog rows when using a user JWT (defense in depth; admin app also uses service role).
drop policy if exists "vehicles_insert_staff" on public.vehicles;
create policy "vehicles_insert_staff" on public.vehicles for insert to authenticated
with check (public.is_ops_staff ());

drop policy if exists "vehicles_update_staff" on public.vehicles;
create policy "vehicles_update_staff" on public.vehicles for update to authenticated using (public.is_ops_staff ())
with check (public.is_ops_staff ());

drop policy if exists "vehicles_delete_staff" on public.vehicles;
create policy "vehicles_delete_staff" on public.vehicles for delete to authenticated using (public.is_ops_staff ());

-- ---------------------------------------------------------------------------
-- bookings: staff read/update (ops notes, status) — customers keep own-row policies
-- ---------------------------------------------------------------------------
drop policy if exists "bookings_select_staff" on public.bookings;
create policy "bookings_select_staff" on public.bookings for select to authenticated using (public.is_ops_staff ());

drop policy if exists "bookings_update_staff" on public.bookings;
create policy "bookings_update_staff" on public.bookings for update to authenticated using (public.is_ops_staff ())
with check (public.is_ops_staff ());

-- ---------------------------------------------------------------------------
-- profiles: staff read/update for KYC / risk / admin notes
-- ---------------------------------------------------------------------------
drop policy if exists "profiles_select_staff" on public.profiles;
create policy "profiles_select_staff" on public.profiles for select to authenticated using (public.is_ops_staff ());

drop policy if exists "profiles_update_staff" on public.profiles;
create policy "profiles_update_staff" on public.profiles for update to authenticated using (public.is_ops_staff ())
with check (public.is_ops_staff ());

-- ---------------------------------------------------------------------------
-- kyc_documents: staff review; customers may delete own pending/reviewing rows (rollback uploads)
-- ---------------------------------------------------------------------------
drop policy if exists "kyc_select_staff" on public.kyc_documents;
create policy "kyc_select_staff" on public.kyc_documents for select to authenticated using (public.is_ops_staff ());

drop policy if exists "kyc_update_staff" on public.kyc_documents;
create policy "kyc_update_staff" on public.kyc_documents for update to authenticated using (public.is_ops_staff ())
with check (public.is_ops_staff ());

drop policy if exists "kyc_delete_own" on public.kyc_documents;
create policy "kyc_delete_own" on public.kyc_documents for delete to authenticated using (
  auth.uid () = user_id
  and status in ('pending', 'reviewing')
);

-- ---------------------------------------------------------------------------
-- notifications / payment_events: staff read-all for support (inserts remain server/service role)
-- ---------------------------------------------------------------------------
drop policy if exists "notifications_select_staff" on public.notifications;
create policy "notifications_select_staff" on public.notifications for select to authenticated using (public.is_ops_staff ());

drop policy if exists "payment_events_select_staff" on public.payment_events;
create policy "payment_events_select_staff" on public.payment_events for select to authenticated using (public.is_ops_staff ());

-- ---------------------------------------------------------------------------
-- Storage: KYC bucket — staff may read any object (signed-URL flows; defense in depth)
-- ---------------------------------------------------------------------------
drop policy if exists "kyc_objects_select_staff" on storage.objects;
create policy "kyc_objects_select_staff" on storage.objects for select to authenticated using (
  bucket_id = 'kyc'
  and public.is_ops_staff ()
);

-- ---------------------------------------------------------------------------
-- Immutable owner FKs on UPDATE (defense in depth alongside staff policies)
-- ---------------------------------------------------------------------------
create or replace function public.enforce_immutable_booking_user_id ()
  returns trigger
  language plpgsql
  security invoker
  set search_path = public
as $$
begin
  if OLD.user_id is distinct from NEW.user_id then
    raise exception 'bookings.user_id cannot be changed';
  end if;
  return NEW;
end;
$$;

drop trigger if exists bookings_immutable_user_id on public.bookings;

create trigger bookings_immutable_user_id before update on public.bookings for each row
execute function public.enforce_immutable_booking_user_id ();

create or replace function public.enforce_immutable_profile_user_id ()
  returns trigger
  language plpgsql
  security invoker
  set search_path = public
as $$
begin
  if OLD.user_id is distinct from NEW.user_id then
    raise exception 'profiles.user_id cannot be changed';
  end if;
  return NEW;
end;
$$;

drop trigger if exists profiles_immutable_user_id on public.profiles;

create trigger profiles_immutable_user_id before update on public.profiles for each row
execute function public.enforce_immutable_profile_user_id ();

create or replace function public.enforce_immutable_kyc_document_user_id ()
  returns trigger
  language plpgsql
  security invoker
  set search_path = public
as $$
begin
  if OLD.user_id is distinct from NEW.user_id then
    raise exception 'kyc_documents.user_id cannot be changed';
  end if;
  return NEW;
end;
$$;

drop trigger if exists kyc_documents_immutable_user_id on public.kyc_documents;

create trigger kyc_documents_immutable_user_id before update on public.kyc_documents for each row
execute function public.enforce_immutable_kyc_document_user_id ();
