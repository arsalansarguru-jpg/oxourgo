-- Let customers read vehicle rows linked to their own bookings (e.g. maintenance/archived still visible on My Bookings).

drop policy if exists "vehicles_select_linked_booking" on public.vehicles;

create policy "vehicles_select_linked_booking" on public.vehicles
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.bookings b
      where b.vehicle_id = vehicles.id
        and b.user_id = auth.uid()
    )
  );

comment on policy "vehicles_select_linked_booking" on public.vehicles is
  'Customers can load vehicle details for cars on their reservations even when off public catalog.';
