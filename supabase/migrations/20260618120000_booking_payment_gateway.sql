-- Future Razorpay / PSP fields on bookings (nullable until checkout is enabled).

alter table public.bookings
  add column if not exists payment_gateway text
    check (payment_gateway is null or payment_gateway in ('razorpay', 'unconfigured'));

alter table public.bookings
  add column if not exists payment_gateway_order_id text;

alter table public.bookings
  add column if not exists payment_gateway_payment_id text;

alter table public.bookings
  add column if not exists payment_checkout_status text not null default 'not_started'
    check (
      payment_checkout_status in (
        'not_started',
        'order_created',
        'authorized',
        'captured',
        'failed',
        'refunded'
      )
    );

create index if not exists bookings_payment_gateway_order_idx on public.bookings (payment_gateway_order_id)
where payment_gateway_order_id is not null;

comment on column public.bookings.payment_gateway is 'PSP identifier when online checkout is used (e.g. razorpay).';
comment on column public.bookings.payment_gateway_order_id is 'Provider order id for webhook correlation.';
comment on column public.bookings.payment_gateway_payment_id is 'Provider payment id after authorization/capture.';
comment on column public.bookings.payment_checkout_status is 'Online checkout lifecycle — independent of rental payment_status.';
