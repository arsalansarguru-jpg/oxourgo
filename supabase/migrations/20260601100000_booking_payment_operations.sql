-- Operational payment tracking: method, amounts, collection metadata, normalized payment_status.

-- ---------------------------------------------------------------------------
-- New columns
-- ---------------------------------------------------------------------------
alter table public.bookings add column if not exists payment_method text default 'pay_at_pickup';

alter table public.bookings add column if not exists amount_due bigint;

alter table public.bookings add column if not exists amount_paid bigint;

alter table public.bookings add column if not exists payment_received_at timestamptz;

alter table public.bookings add column if not exists payment_received_by uuid;

alter table public.bookings add column if not exists payment_notes text;

comment on column public.bookings.payment_method is 'Customer-selected settlement: pay_at_pickup | pay_online (online not wired yet).';

comment on column public.bookings.amount_due is 'Outstanding rental balance in whole INR (matches total_rupees units).';

comment on column public.bookings.amount_paid is 'Cumulative rental collected in whole INR (matches total_rupees units).';

comment on column public.bookings.payment_notes is 'Operational notes from staff (append-only style in app).';

-- ---------------------------------------------------------------------------
-- payment_status: operational set (replace legacy PSP-oriented values)
-- ---------------------------------------------------------------------------
alter table public.bookings drop constraint if exists bookings_payment_status_check;

update public.bookings
set payment_status = 'received'
where payment_status in ('authorized', 'paid');

update public.bookings
set payment_status = 'pending'
where payment_status in ('failed');

alter table public.bookings
  add constraint bookings_payment_status_check check (
    payment_status in ('pending', 'received', 'partial', 'refunded')
  );

-- ---------------------------------------------------------------------------
-- payment_method constraint
-- ---------------------------------------------------------------------------
alter table public.bookings drop constraint if exists bookings_payment_method_chk;

update public.bookings
set payment_method = 'pay_at_pickup'
where payment_method is null
   or trim(payment_method) = '';

alter table public.bookings
  alter column payment_method set default 'pay_at_pickup';

alter table public.bookings
  alter column payment_method set not null;

alter table public.bookings
  add constraint bookings_payment_method_chk check (payment_method in ('pay_at_pickup', 'pay_online'));

-- ---------------------------------------------------------------------------
-- Amount backfill (after status normalization)
-- ---------------------------------------------------------------------------
update public.bookings
set
  amount_paid = coalesce(amount_paid, 0),
  amount_due = greatest(coalesce(total_rupees, 0) - coalesce(amount_paid, 0), 0)
where payment_status = 'partial';

update public.bookings
set
  amount_paid = coalesce(total_rupees, 0),
  amount_due = 0
where payment_status = 'received';

update public.bookings
set
  amount_paid = 0,
  amount_due = coalesce(total_rupees, 0)
where payment_status = 'pending';

update public.bookings
set
  amount_paid = 0,
  amount_due = 0
where payment_status = 'refunded';

-- Safety net
update public.bookings
set amount_paid = 0
where amount_paid is null;

update public.bookings
set amount_due = greatest(coalesce(total_rupees, 0) - coalesce(amount_paid, 0), 0)
where amount_due is null;

alter table public.bookings alter column amount_paid set not null;

alter table public.bookings alter column amount_due set not null;

alter table public.bookings alter column amount_paid set default 0;

alter table public.bookings alter column amount_due set default 0;

-- ---------------------------------------------------------------------------
-- Optional FK to auth.users for attribution
-- ---------------------------------------------------------------------------
do $$
begin
  alter table public.bookings
    add constraint bookings_payment_received_by_fkey foreign key (payment_received_by) references auth.users (id) on delete set null;
exception
  when duplicate_object then null;
end
$$;
