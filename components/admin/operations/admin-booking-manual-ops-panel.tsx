'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Crown, History, ShieldAlert, Truck } from 'lucide-react'

import { AdminConfirmDialog } from '@/components/admin/operations/admin-confirm-dialog'
import { AdminCard, AdminCardContent } from '@/components/admin/admin-card'
import { AdminStatusPill } from '@/components/admin/admin-status-pill'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import {
  adminAppendBookingOpsNoteAction,
  adminApplyBookingDiscountAction,
  adminEmergencyCancelBookingAction,
  adminForceConfirmBookingAction,
  adminManualRentalRefundAction,
  adminSetBookingCustomerFlagsAction,
  adminSetBookingHoldAction,
  adminSetBookingRestrictionsBypassAction,
  adminSwapBookingVehicleAction,
  adminWaiveBookingPenaltiesAction,
} from '@/lib/admin/actions/manual-ops-actions'
import type { BookingVehicleAssignmentRow, BookingOpsActivityRow } from '@/lib/admin/data/operations'
import type { AdminVehicleRow } from '@/lib/admin/data/fleet'
import type { BookingWithCar } from '@/lib/supabase/database.types'
import { formatInr } from '@/lib/format'
import { cn } from '@/lib/utils/cn'

type ConfirmKind = 'force_confirm' | 'emergency_cancel' | null

type Props = {
  booking: BookingWithCar
  vehicles: AdminVehicleRow[]
  activity: BookingOpsActivityRow[]
  assignments: BookingVehicleAssignmentRow[]
  canOverride: boolean
  canFinance: boolean
}

function asFlags(j: unknown): Record<string, boolean> {
  if (!j || typeof j !== 'object' || Array.isArray(j)) return {}
  const out: Record<string, boolean> = {}
  for (const [k, v] of Object.entries(j as Record<string, unknown>)) {
    out[k] = Boolean(v)
  }
  return out
}

export function AdminBookingManualOpsPanel({
  booking,
  vehicles,
  activity,
  assignments,
  canOverride,
  canFinance,
}: Props) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [msg, setMsg] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<ConfirmKind>(null)

  const run = (fn: () => Promise<{ ok: boolean; message?: string }>, onSuccess?: () => void) => {
    setMsg(null)
    start(async () => {
      const r = await fn()
      if (!r.ok) setMsg(r.message ?? 'Action failed.')
      else {
        onSuccess?.()
        router.refresh()
      }
    })
  }

  const flags = asFlags(booking.customer_flags)
  const onHold = Boolean(booking.ops_hold_at)

  return (
    <div className="space-y-6">
      <AdminCard>
        <AdminCardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-electric" />
            <h2 className="text-lg font-semibold text-soft">Manual operations</h2>
            {onHold ? <AdminStatusPill value="on_hold" /> : null}
            {booking.vip_flag ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-100">
                <Crown className="h-3.5 w-3.5" /> VIP
              </span>
            ) : null}
            {booking.restrictions_bypass ? (
              <span className="rounded-full border border-amber-400/25 bg-amber-500/10 px-2.5 py-0.5 text-xs text-amber-100">
                Bypass active
              </span>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            {canOverride && booking.booking_status !== 'cancelled' && booking.booking_status !== 'completed' ? (
              <Button type="button" size="sm" disabled={pending} onClick={() => setConfirm('force_confirm')}>
                Force confirm
              </Button>
            ) : null}
            {canOverride ? (
              <Button type="button" size="sm" variant="danger" disabled={pending} onClick={() => setConfirm('emergency_cancel')}>
                Emergency cancel
              </Button>
            ) : null}
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={pending}
              onClick={() =>
                run(() =>
                  adminSetBookingHoldAction({
                    bookingId: booking.id,
                    onHold: !onHold,
                    reason: onHold ? null : 'Ops hold',
                  }),
                )
              }
            >
              {onHold ? 'Release hold' : 'Hold booking'}
            </Button>
            {canOverride ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() =>
                  run(() => adminSetBookingRestrictionsBypassAction(booking.id, !booking.restrictions_bypass))
                }
              >
                {booking.restrictions_bypass ? 'Disable bypass' : 'Bypass restrictions'}
              </Button>
            ) : null}
          </div>

          {booking.ops_hold_reason ? (
            <p className="text-xs text-amber-200/80">Hold reason: {booking.ops_hold_reason}</p>
          ) : null}
        </AdminCardContent>
      </AdminCard>

      <AdminCard>
        <AdminCardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-electric" />
            <h3 className="font-semibold text-soft">Vehicle swap</h3>
          </div>
          <form
            className="grid gap-3 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault()
              const fd = new FormData(e.currentTarget)
              run(() =>
                adminSwapBookingVehicleAction({
                  bookingId: booking.id,
                  newVehicleId: String(fd.get('newVehicleId') ?? ''),
                  reason: String(fd.get('reason') ?? '').trim() || null,
                  recalculatePricing: fd.get('recalculate') === 'on',
                  bypassOverlap: canOverride && fd.get('bypassOverlap') === 'on',
                }),
              )
            }}
          >
            <Select name="newVehicleId" label="New vehicle" required defaultValue="">
              <option value="" disabled>
                Select replacement
              </option>
              {vehicles
                .filter((v) => v.id !== booking.vehicle_id)
                .map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name || v.brand}
                  </option>
                ))}
            </Select>
            <Input name="reason" label="Reason" placeholder="Breakdown, upgrade, etc." />
            <label className="flex items-center gap-2 text-sm text-muted">
              <input type="checkbox" name="recalculate" className="rounded border-stroke" />
              Recalculate pricing from new vehicle rate
            </label>
            {canOverride ? (
              <label className="flex items-center gap-2 text-sm text-muted">
                <input type="checkbox" name="bypassOverlap" className="rounded border-stroke" />
                Bypass date overlap check
              </label>
            ) : null}
            <div className="sm:col-span-2">
              <Button type="submit" variant="secondary" size="sm" disabled={pending}>
                Swap vehicle
              </Button>
            </div>
          </form>
          {assignments.length > 0 ? (
            <ul className="space-y-2 border-t border-stroke pt-3 text-xs text-muted">
              {assignments.map((a) => (
                <li key={a.id}>
                  {new Date(a.createdAt).toLocaleString()} — {a.reason ?? 'Vehicle changed'}
                  {a.recalculatePricing && a.newTotalRupees != null
                    ? ` · ${formatInr(a.previousTotalRupees ?? 0)} → ${formatInr(a.newTotalRupees)}`
                    : null}
                </li>
              ))}
            </ul>
          ) : null}
        </AdminCardContent>
      </AdminCard>

      <AdminCard>
        <AdminCardContent className="space-y-4">
          <h3 className="font-semibold text-soft">Notes &amp; flags</h3>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault()
              const fd = new FormData(e.currentTarget)
              run(() =>
                adminAppendBookingOpsNoteAction({
                  bookingId: booking.id,
                  note: String(fd.get('note') ?? ''),
                  category: String(fd.get('category') ?? 'operational') as 'private' | 'operational' | 'customer_flag',
                }),
              )
            }}
          >
            <Select name="category" label="Note type" defaultValue="operational">
              <option value="private">Private (staff)</option>
              <option value="operational">Operational</option>
              <option value="customer_flag">Customer flag</option>
            </Select>
            <textarea
              name="note"
              rows={2}
              required
              placeholder="Append to internal notes timeline"
              className="w-full rounded-xl border border-stroke-strong bg-matte/[0.55] px-3 py-2 text-sm text-soft"
            />
            <Button type="submit" variant="secondary" size="sm" disabled={pending}>
              Append note
            </Button>
          </form>
          <form
            className="flex flex-wrap items-end gap-3"
            onSubmit={(e) => {
              e.preventDefault()
              const fd = new FormData(e.currentTarget)
              run(() =>
                adminSetBookingCustomerFlagsAction({
                  bookingId: booking.id,
                  vip: fd.get('vip') === 'on',
                  flags: {
                    high_risk: fd.get('high_risk') === 'on',
                    repeat_customer: fd.get('repeat_customer') === 'on',
                  },
                }),
              )
            }}
          >
            <label className="flex items-center gap-2 text-sm text-muted">
              <input type="checkbox" name="vip" defaultChecked={booking.vip_flag} className="rounded" />
              VIP
            </label>
            <label className="flex items-center gap-2 text-sm text-muted">
              <input type="checkbox" name="high_risk" defaultChecked={flags.high_risk} className="rounded" />
              High risk
            </label>
            <label className="flex items-center gap-2 text-sm text-muted">
              <input type="checkbox" name="repeat_customer" defaultChecked={flags.repeat_customer} className="rounded" />
              Repeat customer
            </label>
            <Button type="submit" variant="outline" size="sm" disabled={pending}>
              Save flags
            </Button>
          </form>
        </AdminCardContent>
      </AdminCard>

      {canFinance ? (
        <AdminCard>
          <AdminCardContent className="space-y-4">
            <h3 className="font-semibold text-soft">Financial overrides</h3>
            <form
              className="grid gap-3 sm:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault()
                const fd = new FormData(e.currentTarget)
                run(() =>
                  adminApplyBookingDiscountAction({
                    bookingId: booking.id,
                    discountRupees: Number(fd.get('discount') ?? 0),
                    note: String(fd.get('note') ?? '').trim() || null,
                  }),
                )
              }}
            >
              <Input name="discount" type="number" label="Discount (₹)" required />
              <Input name="note" label="Note" />
              <div className="sm:col-span-2">
                <Button type="submit" variant="secondary" size="sm" disabled={pending}>
                  Apply discount
                </Button>
              </div>
            </form>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pending}
                onClick={() => run(() => adminWaiveBookingPenaltiesAction({ bookingId: booking.id }))}
              >
                Waive all penalties
              </Button>
            </div>
            <form
              className="grid gap-3 sm:grid-cols-2 border-t border-stroke pt-4"
              onSubmit={(e) => {
                e.preventDefault()
                const fd = new FormData(e.currentTarget)
                run(() =>
                  adminManualRentalRefundAction({
                    bookingId: booking.id,
                    refundRupees: Number(fd.get('refund') ?? 0),
                    note: String(fd.get('refundNote') ?? '').trim() || null,
                  }),
                )
              }}
            >
              <Input name="refund" type="number" label="Manual rental refund (₹)" required />
              <Input name="refundNote" label="Refund note" />
              <div className="sm:col-span-2">
                <Button type="submit" variant="danger" size="sm" disabled={pending}>
                  Process manual refund
                </Button>
              </div>
            </form>
          </AdminCardContent>
        </AdminCard>
      ) : null}

      <AdminCard>
        <AdminCardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-muted" />
            <h3 className="font-semibold text-soft">Activity history</h3>
          </div>
          {activity.length === 0 ? (
            <p className="text-sm text-muted">No ops activity recorded yet.</p>
          ) : (
            <ul className="max-h-64 space-y-2 overflow-y-auto text-xs">
              {activity.map((row) => (
                <li
                  key={row.id}
                  className={cn('rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-muted')}
                >
                  <span className="text-[10px] uppercase tracking-wider text-muted/70">
                    {new Date(row.createdAt).toLocaleString()}
                  </span>
                  <p className="mt-0.5 text-soft/90">{row.summary}</p>
                </li>
              ))}
            </ul>
          )}
        </AdminCardContent>
      </AdminCard>

      {msg ? <p className="text-sm text-red-300">{msg}</p> : null}

      <AdminConfirmDialog
        open={confirm === 'force_confirm'}
        onClose={() => setConfirm(null)}
        title="Force confirm booking"
        description="Skips the normal pending workflow and confirms immediately. Overlap may still block unless bypass is enabled."
        confirmLabel="Force confirm"
        variant="primary"
        requireReason
        pending={pending}
        onConfirm={(reason) => {
          run(
            () => adminForceConfirmBookingAction(booking.id, reason),
            () => setConfirm(null),
          )
        }}
      />
      <AdminConfirmDialog
        open={confirm === 'emergency_cancel'}
        onClose={() => setConfirm(null)}
        title="Emergency cancel"
        description="Immediately cancels this booking regardless of lifecycle stage. The customer may be notified."
        confirmLabel="Cancel now"
        requireReason
        pending={pending}
        onConfirm={(reason) => {
          run(
            () => adminEmergencyCancelBookingAction(booking.id, reason),
            () => setConfirm(null),
          )
        }}
      />
    </div>
  )
}
