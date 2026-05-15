import { formatBookingSourceLabel, normalizeBookingSource } from '@/lib/booking/booking-source'
import { cn } from '@/lib/utils/cn'

export function BookingSourceBadge({ source, className }: { source: string | null | undefined; className?: string }) {
  const normalized = normalizeBookingSource(source)
  const label = formatBookingSourceLabel(source)

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]',
        normalized === 'whatsapp' &&
          'border-emerald-400/35 bg-emerald-500/12 text-emerald-300 theme-light:border-emerald-600/30 theme-light:bg-emerald-50 theme-light:text-emerald-800',
        normalized === 'admin_manual' &&
          'border-amber-400/35 bg-amber-500/12 text-amber-200 theme-light:border-amber-600/30 theme-light:bg-amber-50 theme-light:text-amber-900',
        normalized === 'website' &&
          'border-white/[0.1] bg-white/[0.04] text-muted theme-light:border-stroke-strong theme-light:bg-white/80',
        className,
      )}
    >
      {label}
    </span>
  )
}
