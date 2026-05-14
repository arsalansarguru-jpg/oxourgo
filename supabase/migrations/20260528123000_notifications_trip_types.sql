-- Extend customer notification types for trip lifecycle.

alter table public.notifications drop constraint if exists notifications_type_check;

alter table public.notifications
  add constraint notifications_type_check check (
    type in (
      'booking_received',
      'booking_approved',
      'booking_rejected',
      'booking_cancelled',
      'kyc_submitted',
      'kyc_approved',
      'kyc_rejected',
      'payment_pending',
      'payment_updated',
      'trip_reminder',
      'trip_started',
      'trip_completed'
    )
  );
