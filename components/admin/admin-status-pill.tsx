import { cn } from '@/lib/utils/cn'

const styles: Record<string, string> = {
  pending_payment: 'border-amber-200 bg-amber-50 text-amber-800 theme-dark:border-amber-400/35 theme-dark:bg-amber-500/10 theme-dark:text-amber-100',
  confirmed: 'border-emerald-200 bg-emerald-50 text-emerald-800 theme-dark:border-emerald-400/35 theme-dark:bg-emerald-500/10 theme-dark:text-emerald',
  active: 'border-sky-200 bg-sky-50 text-sky-800 theme-dark:border-sky-400/40 theme-dark:bg-sky-500/12 theme-dark:text-sky-100',
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
  on_hold: 'border-amber-400/40 bg-amber-500/12 text-amber-100',
  vip: 'border-amber-400/35 bg-amber-500/10 text-amber-100',
  service: 'border-violet-400/35 bg-violet-500/10 text-violet-100',
  accident_hold: 'border-red-400/35 bg-red-500/10 text-red-200',
  charge: 'border-sky-400/35 bg-sky-500/10 text-sky-100',
  credit: 'border-emerald-400/35 bg-emerald-500/10 text-emerald',
  deposit_hold: 'border-amber-400/35 bg-amber-500/10 text-amber-100',
  rental_collection: 'border-sky-400/40 bg-sky-500/12 text-sky-100',
  deposit_release: 'border-stroke-strong bg-fill-glass-strong text-muted',
  posted: 'border-emerald-400/35 bg-emerald-500/10 text-emerald',
  void: 'border-stroke-strong bg-fill-glass-strong text-muted',
  partially_refunded: 'border-sky-400/35 bg-sky-500/10 text-sky-100',
  withheld: 'border-red-400/35 bg-red-500/10 text-red-200',
  customer_notified: 'border-sky-400/35 bg-sky-500/10 text-sky-100',
  deducted_from_deposit: 'border-amber-400/35 bg-amber-500/12 text-amber-100',
  disputed: 'border-red-400/40 bg-red-500/10 text-red-200',
  traffic_challan: 'border-rose-400/30 bg-rose-500/10 text-rose-100',
  speeding_fine: 'border-orange-400/30 bg-orange-500/10 text-orange-100',
  toll_violation: 'border-violet-400/30 bg-violet-500/10 text-violet-100',
  parking_penalty: 'border-amber-400/30 bg-amber-500/10 text-amber-100',
  towing_charge: 'border-stroke-strong bg-fill-glass-strong text-soft',
  damage_liability: 'border-red-400/30 bg-red-500/10 text-red-200',
}

const KYC_DOCUMENT_LABELS: Record<string, string> = {
  pending: 'in review',
  reviewing: 'in review',
}

const KYC_PROFILE_LABELS: Record<string, string> = {
  pending: 'in review',
  resubmission_required: 'resubmit',
}

function formatStatusLabel(
  value: string,
  kycDocument?: boolean,
  kycProfile?: boolean,
): string {
  if (kycDocument && KYC_DOCUMENT_LABELS[value]) return KYC_DOCUMENT_LABELS[value]!
  if (kycProfile && KYC_PROFILE_LABELS[value]) return KYC_PROFILE_LABELS[value]!
  return value.replace(/_/g, ' ')
}

export function AdminStatusPill({
  value,
  kycDocument,
  kycProfile,
}: {
  value: string
  /** Use queue terminology (pending → in review) on document rows. */
  kycDocument?: boolean
  kycProfile?: boolean
}) {
  const cls = styles[value] ?? 'border-stroke-strong bg-fill-glass-strong text-soft'
  return (
    <span
      className={cn(
        'inline-flex max-w-full truncate rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide',
        cls,
      )}
    >
      {formatStatusLabel(value, kycDocument, kycProfile)}
    </span>
  )
}
