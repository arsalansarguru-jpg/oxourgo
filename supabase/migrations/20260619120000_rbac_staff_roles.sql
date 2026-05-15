-- Granular staff RBAC for RLS (mirrors lib/auth/roles.ts + lib/auth/permissions.ts).
-- Application role: JWT app_metadata.oxour_role (legacy: app_metadata.role).

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

create or replace function public.is_admin_staff ()
  returns boolean
  language sql
  stable
  security invoker
  set search_path = public
as $$
  select public.jwt_oxour_app_role () in (
    'ops_admin',
    'super_admin',
    'fleet_manager',
    'fleet_host',
    'finance_manager',
    'kyc_reviewer',
    'support_agent'
  );
$$;

create or replace function public.is_fleet_staff ()
  returns boolean
  language sql
  stable
  security invoker
  set search_path = public
as $$
  select public.jwt_oxour_app_role () in ('ops_admin', 'super_admin', 'fleet_manager', 'fleet_host');
$$;

create or replace function public.is_finance_staff ()
  returns boolean
  language sql
  stable
  security invoker
  set search_path = public
as $$
  select public.jwt_oxour_app_role () in ('ops_admin', 'super_admin', 'finance_manager');
$$;

create or replace function public.is_kyc_staff ()
  returns boolean
  language sql
  stable
  security invoker
  set search_path = public
as $$
  select public.jwt_oxour_app_role () in ('ops_admin', 'super_admin', 'kyc_reviewer');
$$;

comment on function public.is_admin_staff is 'Any non-customer staff role (read-only support included).';
comment on function public.is_fleet_staff is 'Fleet + booking operations staff.';
comment on function public.is_finance_staff is 'Payments, deposits, refunds, penalties.';
comment on function public.is_kyc_staff is 'KYC review staff.';

-- vehicles: staff read for all admin roles; writes for fleet + ops; delete fleet + ops only
drop policy if exists "vehicles_select_catalog_or_staff" on public.vehicles;
create policy "vehicles_select_catalog_or_staff" on public.vehicles for select using (
  public.is_admin_staff ()
  or coalesce(availability_status, 'available') in ('available', 'unavailable')
);

drop policy if exists "vehicles_insert_staff" on public.vehicles;
create policy "vehicles_insert_staff" on public.vehicles for insert to authenticated
with check (public.is_fleet_staff ());

drop policy if exists "vehicles_update_staff" on public.vehicles;
create policy "vehicles_update_staff" on public.vehicles for update to authenticated using (public.is_fleet_staff ())
with check (public.is_fleet_staff ());

drop policy if exists "vehicles_delete_staff" on public.vehicles;
create policy "vehicles_delete_staff" on public.vehicles for delete to authenticated using (public.is_fleet_staff ());

-- bookings: all staff read; fleet + ops update
drop policy if exists "bookings_select_staff" on public.bookings;
create policy "bookings_select_staff" on public.bookings for select to authenticated using (public.is_admin_staff ());

drop policy if exists "bookings_update_staff" on public.bookings;
create policy "bookings_update_staff" on public.bookings for update to authenticated using (public.is_fleet_staff ())
with check (public.is_fleet_staff ());

-- profiles: admin staff read; KYC staff + ops update
drop policy if exists "profiles_select_staff" on public.profiles;
create policy "profiles_select_staff" on public.profiles for select to authenticated using (public.is_admin_staff ());

drop policy if exists "profiles_update_staff" on public.profiles;
create policy "profiles_update_staff" on public.profiles for update to authenticated using (
  public.is_kyc_staff () or public.is_ops_staff ()
)
with check (public.is_kyc_staff () or public.is_ops_staff ());

-- kyc_documents
drop policy if exists "kyc_select_staff" on public.kyc_documents;
create policy "kyc_select_staff" on public.kyc_documents for select to authenticated using (
  public.is_kyc_staff () or public.is_admin_staff ()
);

drop policy if exists "kyc_update_staff" on public.kyc_documents;
create policy "kyc_update_staff" on public.kyc_documents for update to authenticated using (public.is_kyc_staff ())
with check (public.is_kyc_staff ());

-- notifications / payment_events
drop policy if exists "notifications_select_staff" on public.notifications;
create policy "notifications_select_staff" on public.notifications for select to authenticated using (public.is_admin_staff ());

drop policy if exists "payment_events_select_staff" on public.payment_events;
create policy "payment_events_select_staff" on public.payment_events for select to authenticated using (
  public.is_finance_staff () or public.is_admin_staff ()
);

-- storage KYC objects
drop policy if exists "kyc_objects_select_staff" on storage.objects;
create policy "kyc_objects_select_staff" on storage.objects for select to authenticated using (
  bucket_id = 'kyc'
  and (public.is_kyc_staff () or public.is_ops_staff ())
);

grant execute on function public.is_admin_staff () to anon, authenticated;
grant execute on function public.is_fleet_staff () to anon, authenticated;
grant execute on function public.is_finance_staff () to anon, authenticated;
grant execute on function public.is_kyc_staff () to anon, authenticated;
