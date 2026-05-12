import Link from 'next/link'
import { Calendar, ChevronRight, MapPin } from 'lucide-react'

import type { CustomerBookingUiStatus } from '@/lib/customer/derive-booking-ui-status'
import { formatInr } from '@/lib/format'
import { cn } from '@/lib/utils/cn'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent } from '@/components/ui/Card'
import { cardSurfaceHover, cardSurfaceTransition } from '@/components/ui/card-tokens'

const statusVariant: Record<CustomerBookingUiStatus, 'electric' | 'success' | 'muted' | 'muted'> = {
  active: 'electric',
  upcoming: 'muted',
  pending_review: 'electric',
  completed: 'success',
  cancelled: 'muted',
}

function bookingUiLabel(ui: CustomerBookingUiStatus): string {
  if (ui === 'pending_review') return 'Pending review'
  return ui
}

export type CustomerBookingCardProps = {
  bookingId: string
  carLabel: string
  uiStatus: CustomerBookingUiStatus
  pickupAt: string
  returnAt: string
  pickupLocation: string
  returnLocation: string
  totalRupees: number
  paymentStatus: string
}

export function CustomerBookingCard({
  bookingId,
  carLabel,
  uiStatus,
  pickupAt,
  returnAt,
  pickupLocation,
  returnLocation,
  totalRupees,
  paymentStatus,
}: CustomerBookingCardProps) {
  const pickupFmt = new Date(pickupAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
  const returnFmt = new Date(returnAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })

  return (
    <Card className={cn(cardSurfaceTransition, cardSurfaceHover, 'overflow-hidden')}>
      <CardContent className="p-0">
        <Link
          href={`/dashboard/bookings/${bookingId}`}
          className="flex flex-col gap-4 p-4 transition-colors hover:bg-white/[0.03] sm:flex-row sm:items-center sm:justify-between sm:p-5"
        >
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold tracking-[-0.02em] text-soft">{carLabel}</p>
              <Badge variant={statusVariant[uiStatus]}>{bookingUiLabel(uiStatus)}</Badge>
            </div>
            <div className="flex flex-col gap-1 text-xs text-muted sm:text-sm">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 shrink-0 text-electric/80" aria-hidden />
                {pickupFmt} → {returnFmt}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-electric/80" aria-hidden />
                {pickupLocation} → {returnLocation}
              </span>
            </div>
          </div>
          <div className="flex shrink-0 items-center justify-between gap-4 sm:flex-col sm:items-end">
            <div className="text-right">
              <p className="text-lg font-semibold tabular-nums text-soft">{formatInr(totalRupees)}</p>
              <p className="text-[11px] uppercase tracking-wide text-muted">Pay: {paymentStatus}</p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted sm:hidden" aria-hidden />
          </div>
        </Link>
      </CardContent>
    </Card>
  )
}
