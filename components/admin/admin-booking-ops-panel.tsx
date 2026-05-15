'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

import {
  adminApproveBookingAction,
  adminCancelBookingAction,
  adminMarkCompletedAction,
  adminMarkHandedOverAction,
  adminMarkReturnedAction,
  adminRejectBookingAction,
  adminSetBookingDepositTrackingAction,
  adminSetBookingInternalNotesAction,
  adminSetBookingPaymentStatusAction,
  adminSetBookingStatusAction,
} from '@/lib/admin/actions/booking-actions'
import {
  adminCreateDepositHoldPlaceholderAction,
  adminCreateRefundPlaceholderAction,
  adminMarkBookingPartialPaymentAction,
  adminMarkBookingPaymentReceivedAction,
  adminMarkBookingPaymentRefundedAction,
} from '@/lib/admin/actions/payment-actions'
import type { BookingWithCar } from '@/lib/supabase/database.types'
import { formatInr } from '@/lib/format'
import { formatPaymentMethodLabel } from '@/lib/payments/booking-payment'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { AdminCard, AdminCardContent } from '@/components/admin/admin-card'
import { AdminBookingInspectionWorkspace } from '@/components/admin/bookings/admin-booking-inspection-workspace'
import type { AdminInspectionBundle } from '@/lib/admin/data/booking-inspection'

export function AdminBookingOpsPanel({
  booking,
  inspection,
}: {
  booking: BookingWithCar
  inspection: AdminInspectionBundle
}) {
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
      <AdminCard>
        <AdminCardContent className="space-y-4">
          <h2 className="text-lg font-semibold text-soft">Operations workflow</h2>
          <p className="text-xs text-muted">
            Approve pending requests, hand over keys, log return inspection, then close the trip. Cancellations notify
            the customer where configured.
          </p>
          <div className="flex flex-wrap gap-2">
            {booking.booking_status === 'pending_payment' ? (
              <>
                <Button type="button" disabled={pending} onClick={() => run(() => adminApproveBookingAction(booking.id))}>
                  Approve booking
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  disabled={pending}
                  onClick={() => {
                    const note = window.prompt('Rejection note (shown to customer if provided)') ?? ''
                    run(() => adminRejectBookingAction(booking.id, note || undefined))
                  }}
                >
                  Reject
                </Button>
              </>
            ) : null}
            {booking.booking_status === 'confirmed' ? (
              <Button type="button" variant="secondary" disabled={pending} onClick={() => run(() => adminMarkHandedOverAction(booking.id))}>
                Mark handed over
              </Button>
            ) : null}
            {booking.booking_status === 'active' && !booking.returned_at ? (
              <Button type="button" variant="secondary" disabled={pending} onClick={() => run(() => adminMarkReturnedAction(booking.id))}>
                Mark returned
              </Button>
            ) : null}
            {booking.booking_status === 'active' ? (
              <Button type="button" variant="secondary" disabled={pending} onClick={() => run(() => adminMarkCompletedAction(booking.id))}>
                Mark completed
              </Button>
            ) : null}
            {booking.booking_status !== 'cancelled' && booking.booking_status !== 'completed' ? (
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={() => {
                  if (!window.confirm('Cancel this booking?')) return
                  const note = window.prompt('Cancellation note (optional, may be shown to customer)') ?? ''
                  run(() => adminCancelBookingAction(booking.id, note || undefined))
                }}
              >
                Cancel booking
              </Button>
            ) : null}
          </div>
        </AdminCardContent>
      </AdminCard>

      <AdminBookingInspectionWorkspace booking={booking} inspection={inspection} />

      <AdminCard>
        <AdminCardContent className="space-y-4">
          <h2 className="text-lg font-semibold text-soft">Refundable deposit tracking</h2>
          <form
            className="grid gap-3 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault()
              const fd = new FormData(e.currentTarget)
              const held = fd.get('held')?.toString().trim()
              const refundedAt = fd.get('refunded_at')?.toString().trim()
              const refunded = fd.get('refunded')?.toString().trim()
              run(async () =>
                adminSetBookingDepositTrackingAction({
                  bookingId: booking.id,
                  depositHeldRupees: held === '' ? null : Number(held),
                  depositRefundedAt: refundedAt === '' ? null : refundedAt || null,
                  depositRefundedRupees: refunded === '' ? null : Number(refunded),
                }),
              )
            }}
          >
            <Input
              name="held"
              type="number"
              label="Deposit held (₹)"
              defaultValue={booking.deposit_held_rupees ?? ''}
              className="min-h-10"
            />
            <Input
              name="refunded_at"
              label="Refunded at (ISO)"
              placeholder="2026-01-15T10:00:00.000Z"
              defaultValue={booking.deposit_refunded_at ?? ''}
              className="min-h-10"
            />
            <Input
              name="refunded"
              type="number"
              label="Amount refunded (₹)"
              defaultValue={booking.deposit_refunded_rupees ?? ''}
              className="min-h-10"
            />
            <div className="flex items-end">
              <Button type="submit" variant="secondary" disabled={pending}>
                Save deposit fields
              </Button>
            </div>
          </form>
        </AdminCardContent>
      </AdminCard>

      <AdminCard>
        <AdminCardContent className="space-y-4">
          <h2 className="text-lg font-semibold text-soft">Internal notes (staff only)</h2>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault()
              const fd = new FormData(e.currentTarget)
              run(async () =>
                adminSetBookingInternalNotesAction(booking.id, String(fd.get('internal') ?? '')),
              )
            }}
          >
            <textarea
              name="internal"
              rows={4}
              defaultValue={booking.admin_internal_notes ?? ''}
              placeholder="Handover quirks, damage notes, VIP context — not shown to customers."
              className="min-h-[100px] w-full rounded-xl border border-stroke-strong bg-matte/[0.55] px-3 py-2 text-sm text-soft placeholder:text-muted/80 focus-visible:border-electric/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric/22"
            />
            <Button type="submit" variant="secondary" size="sm" disabled={pending}>
              Save internal notes
            </Button>
          </form>
        </AdminCardContent>
      </AdminCard>

      <AdminCard>
        <AdminCardContent className="space-y-4">
          <h2 className="text-lg font-semibold text-soft">Rental payment (ops)</h2>
          <p className="text-xs leading-relaxed text-muted">
            Method: <span className="font-medium text-soft">{formatPaymentMethodLabel(booking.payment_method)}</span> ·
            Balance due <span className="font-medium text-soft">{formatInr(booking.amount_due ?? 0)}</span> · Collected{' '}
            <span className="font-medium text-soft">{formatInr(booking.amount_paid ?? 0)}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={pending}
              onClick={() => {
                const note = window.prompt('Optional note for the customer ledger') ?? ''
                run(() => adminMarkBookingPaymentReceivedAction(booking.id, note || undefined))
              }}
            >
              Mark payment received
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={pending}
              onClick={() => {
                if (!window.confirm('Reset rental payment to pending with full balance due?')) return
                run(() => adminSetBookingPaymentStatusAction(booking.id, 'pending'))
              }}
            >
              Reset to pending
            </Button>
            <Button
              type="button"
              variant="danger"
              disabled={pending}
              onClick={() => {
                if (!window.confirm('Mark this booking rental as refunded in ops?')) return
                const note = window.prompt('Optional refund context') ?? ''
                run(() => adminMarkBookingPaymentRefundedAction(booking.id, note || undefined))
              }}
            >
              Mark refunded
            </Button>
          </div>
          <form
            className="grid gap-3 border-t border-stroke pt-4 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault()
              const fd = new FormData(e.currentTarget)
              const raw = fd.get('partial_collected')?.toString().trim() ?? ''
              const note = fd.get('partial_note')?.toString().trim() ?? ''
              const amount = Number(raw)
              run(async () =>
                adminMarkBookingPartialPaymentAction({
                  bookingId: booking.id,
                  amountPaidRupees: amount,
                  note: note || null,
                }),
              )
            }}
          >
            <Input
              name="partial_collected"
              type="number"
              label="Partial · cumulative collected (₹)"
              placeholder="e.g. 15000"
              defaultValue={booking.amount_paid > 0 ? String(booking.amount_paid) : undefined}
              className="min-h-10"
            />
            <Input name="partial_note" label="Optional note" placeholder="UPI / bank ref" className="min-h-10" />
            <div className="flex items-end sm:col-span-2">
              <Button type="submit" variant="secondary" disabled={pending}>
                Mark partial payment
              </Button>
            </div>
          </form>
        </AdminCardContent>
      </AdminCard>

      <AdminCard>
        <AdminCardContent className="space-y-4">
          <h2 className="text-lg font-semibold text-soft">Statuses</h2>
          <p className="text-xs text-muted">
            Prefer the workflow buttons above. Manual overrides are audited and should be rare.
          </p>
          <form
            className="grid gap-4 sm:grid-cols-2"
            action={(fd) => {
              run(async () => adminSetBookingStatusAction(booking.id, String(fd.get('booking_status'))))
            }}
          >
            <Select name="booking_status" label="Booking status" defaultValue={booking.booking_status}>
              <option value="pending_payment">Pending payment</option>
              <option value="confirmed">Confirmed</option>
              <option value="active">Active (on trip)</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </Select>
            <div className="flex items-end">
              <Button type="submit" variant="secondary" disabled={pending}>
                Update status
              </Button>
            </div>
          </form>
        </AdminCardContent>
      </AdminCard>

      <AdminCard>
        <AdminCardContent className="space-y-4">
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
        </AdminCardContent>
      </AdminCard>

      {msg ? <p className="text-sm text-red-300">{msg}</p> : null}
    </div>
  )
}
