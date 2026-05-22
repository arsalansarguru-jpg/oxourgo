-- DB-level audit capture for booking lifecycle (complements application writeAuditLog).
-- Uses to_jsonb(OLD/NEW) so triggers survive missing optional payment/deposit columns on older DBs.

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

comment on function public.audit_log_booking_change is 'Append-only audit rows for booking inserts and material updates.';
