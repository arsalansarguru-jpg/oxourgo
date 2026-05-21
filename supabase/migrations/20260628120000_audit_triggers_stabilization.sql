-- DB-level audit capture for booking lifecycle (complements application writeAuditLog).

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
begin
  if tg_op = 'INSERT' then
    v_action := 'booking.created';
    v_new := jsonb_build_object(
      'booking_status', new.booking_status,
      'payment_status', new.payment_status,
      'total_rupees', new.total_rupees,
      'user_id', new.user_id,
      'vehicle_id', new.vehicle_id
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
    if new.deleted_at is not null and (old.deleted_at is null) then
      v_action := 'booking.soft_deleted';
    elsif old.booking_status is distinct from new.booking_status then
      v_action := 'booking.status_changed';
    elsif old.payment_status is distinct from new.payment_status then
      v_action := 'booking.payment_status_changed';
    else
      v_action := 'booking.updated';
    end if;

    v_old := jsonb_build_object(
      'booking_status', old.booking_status,
      'payment_status', old.payment_status,
      'amount_paid', old.amount_paid,
      'amount_due', old.amount_due
    );
    v_new := jsonb_build_object(
      'booking_status', new.booking_status,
      'payment_status', new.payment_status,
      'amount_paid', new.amount_paid,
      'amount_due', new.amount_due
    );

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

comment on function public.audit_log_booking_change is 'Append-only audit rows for booking inserts and material updates.';
