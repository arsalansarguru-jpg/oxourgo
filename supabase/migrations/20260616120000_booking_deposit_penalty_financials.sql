-- Deposit status workflow, extended penalty categories, financial summary columns.

alter table public.bookings
  add column if not exists deposit_amount integer
    check (deposit_amount is null or deposit_amount >= 0);

alter table public.bookings
  add column if not exists deposit_status text not null default 'pending'
    check (
      deposit_status in (
        'pending',
        'received',
        'partially_refunded',
        'refunded',
        'withheld'
      )
    );

alter table public.bookings
  add column if not exists refund_amount integer not null default 0
    check (refund_amount >= 0);

alter table public.bookings
  add column if not exists penalty_total integer not null default 0
    check (penalty_total >= 0);

alter table public.bookings
  add column if not exists deductions jsonb not null default '{}'::jsonb;

alter table public.bookings
  add column if not exists refund_processed_at timestamptz;

alter table public.bookings
  add column if not exists penalty_fuel_rupees integer not null default 0
    check (penalty_fuel_rupees >= 0);

alter table public.bookings
  add column if not exists penalty_cleaning_rupees integer not null default 0
    check (penalty_cleaning_rupees >= 0);

alter table public.bookings
  add column if not exists penalty_traffic_rupees integer not null default 0
    check (penalty_traffic_rupees >= 0);

alter table public.bookings
  add column if not exists penalty_notes jsonb not null default '{}'::jsonb;

alter table public.bookings
  add column if not exists financial_manual_override boolean not null default false;

alter table public.bookings
  add column if not exists deposit_received_at timestamptz;

comment on column public.bookings.deposit_amount is 'Security deposit amount held for this trip (INR whole rupees).';
comment on column public.bookings.deposit_status is 'pending | received | partially_refunded | refunded | withheld';
comment on column public.bookings.refund_amount is 'Amount refunded to customer from deposit after deductions.';
comment on column public.bookings.penalty_total is 'Sum of all penalty line items (may differ from deposit applied when override).';
comment on column public.bookings.deductions is 'JSON breakdown: categories, amounts, notes, computed refund.';

-- Backfill deposit_amount from vehicle security deposit or legacy held amount
update public.bookings b
set
  deposit_amount = coalesce(
    b.deposit_held_rupees,
    (
      select v.security_deposit
      from public.vehicles v
      where v.id = b.vehicle_id
    ),
    0
  )
where b.deposit_amount is null;

update public.bookings b
set deposit_status = case
  when b.deposit_refunded_at is not null and coalesce(b.deposit_refunded_rupees, 0) > 0
    and coalesce(b.deposit_refunded_rupees, 0) < coalesce(b.deposit_amount, b.deposit_held_rupees, 0) then 'partially_refunded'
  when b.deposit_refunded_at is not null then 'refunded'
  when coalesce(b.deposit_held_rupees, 0) > 0 then 'received'
  else 'pending'
end
where b.deposit_status = 'pending';

update public.bookings
set
  penalty_total = greatest(
    0,
    coalesce(penalty_damage_rupees, 0)
    + coalesce(penalty_late_rupees, 0)
    + coalesce(penalty_extra_km_rupees, 0)
    + coalesce(penalty_fuel_rupees, 0)
    + coalesce(penalty_cleaning_rupees, 0)
    + coalesce(penalty_traffic_rupees, 0)
  ),
  refund_amount = coalesce(deposit_refunded_rupees, 0)
where penalty_total = 0 or refund_amount = 0;

create index if not exists bookings_deposit_status_idx on public.bookings (deposit_status)
where deposit_status in ('pending', 'received', 'partially_refunded');
