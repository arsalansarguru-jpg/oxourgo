'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

import {
  adminApproveBookingAction,
  adminCancelBookingAction,
  adminRejectBookingAction,
  adminSetBookingPaymentStatusAction,
  adminSetBookingStatusAction,
} from '@/lib/admin/actions/booking-actions'
import {
  adminCreateDepositHoldPlaceholderAction,
  adminCreateRefundPlaceholderAction,
} from '@/lib/admin/actions/payment-actions'
import type { BookingWithCar } from '@/lib/supabase/database.types'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Card, CardContent } from '@/components/ui/Card'
import { cn } from '@/lib/utils/cn'
import { cardSurfaceBase } from '@/components/ui/card-tokens'

export function AdminBookingOpsPanel({ booking }: { booking: BookingWithCar }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [msg, setMsg] = useState<string | null>(null)

  const run = (fn: () => Promise<{ ok: boolean; message?: string }>) => {
    setMsg(null)
    start(async () => {
      const r = await fn()
      if (!r.ok) setMsg(r.message ?? 'Request failed')
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      <Card className={cn(cardSurfaceBase, 'border border-stroke')}>
        <CardContent className="space-y-4 p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-soft">Workflow</h2>
          <div className="flex flex-wrap gap-2">
            {booking.booking_status === 'pending_payment' ? (
              <>
                <Button type="button" disabled={pending} onClick={() => run(() => adminApproveBookingAction(booking.id))}>
                  Approve
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  disabled={pending}
                  onClick={() => {
                    const note = window.prompt('Rejection note (optional)') ?? ''
                    run(() => adminRejectBookingAction(booking.id, note || undefined))
                  }}
                >
                  Reject
                </Button>
              </>
            ) : null}
            {booking.booking_status !== 'cancelled' && booking.booking_status !== 'completed' ? (
              <Button
                type="button"
                variant="secondary"
                disabled={pending}
                onClick={() => {
                  const note = window.prompt('Cancellation note (optional)') ?? ''
                  run(() => adminCancelBookingAction(booking.id, note || undefined))
                }}
              >
                Cancel booking
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card className={cn(cardSurfaceBase, 'border border-stroke')}>
        <CardContent className="space-y-4 p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-soft">Statuses</h2>
          <form
            className="grid gap-4 sm:grid-cols-2"
            action={(fd) => {
              run(async () => adminSetBookingStatusAction(booking.id, String(fd.get('booking_status'))))
            }}
          >
            <Select name="booking_status" label="Booking status" defaultValue={booking.booking_status}>
              <option value="pending_payment">Pending payment</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
              <option value="completed">Completed</option>
            </Select>
            <div className="flex items-end">
              <Button type="submit" variant="secondary" disabled={pending}>
                Update status
              </Button>
            </div>
          </form>
          <form
            className="grid gap-4 sm:grid-cols-2"
            action={(fd) => {
              run(async () => adminSetBookingPaymentStatusAction(booking.id, String(fd.get('payment_status'))))
            }}
          >
            <Select name="payment_status" label="Payment status" defaultValue={booking.payment_status}>
              <option value="pending">Pending</option>
              <option value="authorized">Authorized</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </Select>
            <div className="flex items-end">
              <Button type="submit" variant="secondary" disabled={pending}>
                Update payment
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className={cn(cardSurfaceBase, 'border border-stroke')}>
        <CardContent className="space-y-4 p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-soft">Payment ledger placeholders</h2>
          <p className="text-sm text-muted">
            Creates <code className="rounded bg-fill-glass-strong px-1 font-mono text-xs">payment_events</code> rows for finance
            follow-up. Does not call a PSP.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={pending}
              onClick={() => run(() => adminCreateRefundPlaceholderAction(booking.id))}
            >
              Refund placeholder
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={pending}
              onClick={() => run(() => adminCreateDepositHoldPlaceholderAction(booking.id))}
            >
              Deposit hold placeholder
            </Button>
          </div>
        </CardContent>
      </Card>

      {msg ? <p className="text-sm text-red-300">{msg}</p> : null}
    </div>
  )
}
