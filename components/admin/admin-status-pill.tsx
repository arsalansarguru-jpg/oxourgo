import { cn } from '@/lib/utils/cn'

const styles: Record<string, string> = {
  pending_payment: 'border-amber-400/35 bg-amber-500/10 text-amber-100',
  confirmed: 'border-emerald-400/35 bg-emerald-500/10 text-emerald',
  active: 'border-sky-400/40 bg-sky-500/12 text-sky-100',
  cancelled: 'border-stroke-strong bg-fill-glass-strong text-muted',
  completed: 'border-sky-400/35 bg-sky-500/10 text-sky-100',
  pending: 'border-amber-400/35 bg-amber-500/10 text-amber-100',
  received: 'border-emerald-400/35 bg-emerald-500/10 text-emerald',
  partial: 'border-amber-400/35 bg-amber-500/12 text-amber-100',
  paid: 'border-emerald-400/35 bg-emerald-500/10 text-emerald',
  failed: 'border-red-400/40 bg-red-500/10 text-red-200',
  refunded: 'border-stroke-strong bg-fill-glass-strong text-muted',
  authorized: 'border-violet-400/35 bg-violet-500/10 text-violet-100',
  none: 'border-stroke-strong bg-fill-glass-strong text-muted',
  basic: 'border-sky-400/35 bg-sky-500/10 text-sky-100',
  verified: 'border-emerald-400/35 bg-emerald-500/10 text-emerald',
  reviewing: 'border-violet-400/35 bg-violet-500/10 text-violet-100',
  approved: 'border-emerald-400/35 bg-emerald-500/10 text-emerald',
  rejected: 'border-red-400/40 bg-red-500/10 text-red-200',
  resubmission_required: 'border-amber-400/40 bg-amber-500/12 text-amber-100',
  available: 'border-emerald-400/35 bg-emerald-500/10 text-emerald',
  unavailable: 'border-stroke-strong bg-fill-glass-strong text-muted',
  maintenance: 'border-amber-400/35 bg-amber-500/10 text-amber-100',
  charge: 'border-sky-400/35 bg-sky-500/10 text-sky-100',
  credit: 'border-emerald-400/35 bg-emerald-500/10 text-emerald',
  deposit_hold: 'border-amber-400/35 bg-amber-500/10 text-amber-100',
  rental_collection: 'border-sky-400/40 bg-sky-500/12 text-sky-100',
  deposit_release: 'border-stroke-strong bg-fill-glass-strong text-muted',
  posted: 'border-emerald-400/35 bg-emerald-500/10 text-emerald',
  void: 'border-stroke-strong bg-fill-glass-strong text-muted',
}

export function AdminStatusPill({ value }: { value: string }) {
  const cls = styles[value] ?? 'border-stroke-strong bg-fill-glass-strong text-soft'
  return (
    <span
      className={cn(
        'inline-flex max-w-full truncate rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide',
        cls,
      )}
    >
      {value.replace(/_/g, ' ')}
    </span>
  )
}
