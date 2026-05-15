import { CreditCard } from 'lucide-react'

import { ONLINE_PAYMENTS_COMING_SOON_MESSAGE } from '@/lib/payments/config.public'
import { cn } from '@/lib/utils/cn'

export function OnlinePaymentNotice({
  className,
  compact,
}: {
  className?: string
  compact?: boolean
}) {
  return (
    <div
      className={cn(
        'flex gap-3 rounded-2xl border border-stroke bg-matte/[0.35] px-4 py-3',
        compact && 'py-2.5',
        className,
      )}
      role="status"
    >
      <CreditCard className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden />
      <p className={cn('leading-relaxed text-muted', compact ? 'text-xs' : 'text-sm')}>
        <span className="font-medium text-soft">{ONLINE_PAYMENTS_COMING_SOON_MESSAGE}</span>
        {!compact ? (
          <span className="text-muted"> — pay at pickup remains available for all reservations.</span>
        ) : null}
      </p>
    </div>
  )
}
