import { cn } from '@/lib/utils/cn'

const styles: Record<string, string> = {
  pending_payment: 'border-amber-400/35 bg-amber-500/10 text-amber-100',
  confirmed: 'border-emerald-400/35 bg-emerald-500/10 text-emerald',
  cancelled: 'border-white/15 bg-white/[0.06] text-muted',
  completed: 'border-sky-400/35 bg-sky-500/10 text-sky-100',
  pending: 'border-amber-400/35 bg-amber-500/10 text-amber-100',
  paid: 'border-emerald-400/35 bg-emerald-500/10 text-emerald',
  failed: 'border-red-400/40 bg-red-500/10 text-red-200',
  refunded: 'border-white/15 bg-white/[0.06] text-muted',
  authorized: 'border-violet-400/35 bg-violet-500/10 text-violet-100',
  none: 'border-white/15 bg-white/[0.06] text-muted',
  basic: 'border-sky-400/35 bg-sky-500/10 text-sky-100',
  verified: 'border-emerald-400/35 bg-emerald-500/10 text-emerald',
  reviewing: 'border-violet-400/35 bg-violet-500/10 text-violet-100',
  approved: 'border-emerald-400/35 bg-emerald-500/10 text-emerald',
  rejected: 'border-red-400/40 bg-red-500/10 text-red-200',
  available: 'border-emerald-400/35 bg-emerald-500/10 text-emerald',
  unavailable: 'border-white/15 bg-white/[0.06] text-muted',
  maintenance: 'border-amber-400/35 bg-amber-500/10 text-amber-100',
  charge: 'border-sky-400/35 bg-sky-500/10 text-sky-100',
  credit: 'border-emerald-400/35 bg-emerald-500/10 text-emerald',
  deposit_hold: 'border-amber-400/35 bg-amber-500/10 text-amber-100',
  deposit_release: 'border-white/15 bg-white/[0.06] text-muted',
  posted: 'border-emerald-400/35 bg-emerald-500/10 text-emerald',
  void: 'border-white/15 bg-white/[0.06] text-muted',
}

export function AdminStatusPill({ value }: { value: string }) {
  const cls = styles[value] ?? 'border-white/15 bg-white/[0.06] text-soft'
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
