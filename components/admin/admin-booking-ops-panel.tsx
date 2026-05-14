'use client'

import { useRouter } from 'next/navigation'
import { useMemo, useState, useTransition } from 'react'

import {
  adminApproveBookingAction,
  adminCancelBookingAction,
  adminMarkCompletedAction,
  adminMarkHandedOverAction,
  adminMarkReturnedAction,
  adminRejectBookingAction,
  adminSaveBookingChecklistsAction,
  adminSetBookingDepositTrackingAction,
  adminSetBookingInternalNotesAction,
  adminSetBookingPaymentStatusAction,
  adminSetBookingStatusAction,
} from '@/lib/admin/actions/booking-actions'
import {
  adminCreateDepositHoldPlaceholderAction,
  adminCreateRefundPlaceholderAction,
} from '@/lib/admin/actions/payment-actions'
import type { BookingWithCar } from '@/lib/supabase/database.types'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { AdminCard, AdminCardContent } from '@/components/admin/admin-card'

const PICKUP_KEYS = [
  { id: 'id_verified', label: 'Customer ID verified' },
  { id: 'vehicle_walkaround', label: 'Vehicle walkaround / photos' },
  { id: 'fuel_level', label: 'Fuel level recorded' },
  { id: 'deposit_auth', label: 'Security deposit pre-auth captured' },
] as const

const RETURN_KEYS = [
  { id: 'mileage', label: 'Return mileage recorded' },
  { id: 'fuel_return', label: 'Fuel level at return' },
  { id: 'damage_check', label: 'Damage inspection complete' },
  { id: 'keys_returned', label: 'Keys & accessories returned' },
] as const

function readChecklist(map: unknown): Record<string, boolean> {
  if (!map || typeof map !== 'object' || Array.isArray(map)) return {}
  const out: Record<string, boolean> = {}
  for (const [k, v] of Object.entries(map as Record<string, unknown>)) {
    out[k] = Boolean(v)
  }
  return out
}

export function AdminBookingOpsPanel({ booking }: { booking: BookingWithCar }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [msg, setMsg] = useState<string | null>(null)

  const pickupState = useMemo(() => readChecklist(booking.pickup_checklist), [booking.pickup_checklist])
  const returnState = useMemo(() => readChecklist(booking.return_checklist), [booking.return_checklist])

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

      <AdminCard key={`checklists-${booking.id}-${booking.updated_at}`}>
        <AdminCardContent className="space-y-4">
          <h2 className="text-lg font-semibold text-soft">Pickup &amp; return checklists</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 rounded-xl border border-stroke bg-matte/[0.35] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Pickup</p>
              <ul className="space-y-2">
                {PICKUP_KEYS.map((item) => (
                  <li key={item.id} className="flex items-center gap-2">
                    <input
                      id={`pick-${item.id}`}
                      type="checkbox"
                      className="h-4 w-4 rounded border-stroke-strong"
                      defaultChecked={pickupState[item.id] === true}
                      disabled={pending}
                      onChange={(e) => {
                        run(async () =>
                          adminSaveBookingChecklistsAction({
                            bookingId: booking.id,
                            pickup: { [item.id]: e.target.checked },
                          }),
                        )
                      }}
                    />
                    <label htmlFor={`pick-${item.id}`} className="text-sm text-soft">
                      {item.label}
                    </label>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-2 rounded-xl border border-stroke bg-matte/[0.35] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Return</p>
              <ul className="space-y-2">
                {RETURN_KEYS.map((item) => (
                  <li key={item.id} className="flex items-center gap-2">
                    <input
                      id={`ret-${item.id}`}
                      type="checkbox"
                      className="h-4 w-4 rounded border-stroke-strong"
                      defaultChecked={returnState[item.id] === true}
                      disabled={pending}
                      onChange={(e) => {
                        run(async () =>
                          adminSaveBookingChecklistsAction({
                            bookingId: booking.id,
                            return: { [item.id]: e.target.checked },
                          }),
                        )
                      }}
                    />
                    <label htmlFor={`ret-${item.id}`} className="text-sm text-soft">
                      {item.label}
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </AdminCardContent>
      </AdminCard>

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
