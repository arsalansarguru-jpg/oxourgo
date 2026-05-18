'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { PlusCircle } from 'lucide-react'

import { AdminCard, AdminCardContent } from '@/components/admin/admin-card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { adminCreateManualBookingAction } from '@/lib/admin/actions/manual-ops-actions'
import type { AdminVehicleRow } from '@/lib/admin/data/fleet'
import { PICKUP_HUB } from '@/lib/booking/constants'

type Props = {
  vehicles: AdminVehicleRow[]
  canBypass: boolean
}

export function AdminManualBookingPanel({ vehicles, canBypass }: Props) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [msg, setMsg] = useState<string | null>(null)

  return (
    <AdminCard>
      <AdminCardContent className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-electric/25 bg-electric/10">
            <PlusCircle className="h-5 w-5 text-electric" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-soft">Manual booking</h2>
            <p className="text-xs leading-relaxed text-muted">
              Create a reservation without the customer website flow.{' '}
              <Link href="/admin/customers" className="text-electric hover:underline">
                Find customer ID
              </Link>
            </p>
          </div>
        </div>

        <form
          className="grid gap-3 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault()
            setMsg(null)
            const fd = new FormData(e.currentTarget)
            start(async () => {
              const r = await adminCreateManualBookingAction({
                userId: String(fd.get('userId') ?? '').trim(),
                vehicleId: String(fd.get('vehicleId') ?? '').trim(),
                pickupAtIso: String(fd.get('pickupAt') ?? ''),
                returnAtIso: String(fd.get('returnAt') ?? ''),
                pickupLocation: String(fd.get('pickupLocation') ?? '').trim(),
                returnLocation: String(fd.get('returnLocation') ?? '').trim(),
                paymentMethod: String(fd.get('paymentMethod') ?? 'pay_at_pickup'),
                requireKyc: fd.get('skipKyc') !== 'on',
                bypassRestrictions: canBypass && fd.get('bypassRestrictions') === 'on',
                autoConfirm: fd.get('autoConfirm') === 'on',
                vipFlag: fd.get('vipFlag') === 'on',
                adminInternalNotes: String(fd.get('internalNotes') ?? '').trim() || null,
                opsNote: String(fd.get('opsNote') ?? '').trim() || null,
                pricingOverride: {
                  pricePerDayRupees: Number(fd.get('pricePerDay')) || undefined,
                  totalRupees: Number(fd.get('totalRupees')) || undefined,
                  depositAmountRupees: Number(fd.get('depositRupees')) || undefined,
                  customDiscountRupees: Number(fd.get('discountRupees')) || undefined,
                },
              })
              if (!r.ok) {
                setMsg(r.message ?? 'Could not create booking.')
                return
              }
              if (r.bookingId) {
                router.push(`/admin/bookings/${r.bookingId}`)
              } else {
                router.refresh()
              }
            })
          }}
        >
          <Input name="userId" label="Customer user ID" required placeholder="UUID from Customers" className="sm:col-span-2" />
          <Select name="vehicleId" label="Vehicle" required defaultValue="">
            <option value="" disabled>
              Select vehicle
            </option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name || v.brand} · ₹{v.price_per_day}/day
              </option>
            ))}
          </Select>
          <Select name="paymentMethod" label="Payment" defaultValue="pay_at_pickup">
            <option value="pay_at_pickup">Pay at pickup</option>
          </Select>
          <Input name="pickupAt" type="datetime-local" label="Pickup" required />
          <Input name="returnAt" type="datetime-local" label="Return" required />
          <input type="hidden" name="pickupLocation" value={PICKUP_HUB} />
          <input type="hidden" name="returnLocation" value={PICKUP_HUB} />
          <p className="text-sm text-muted sm:col-span-2">
            Pickup and return at <span className="font-semibold text-soft">{PICKUP_HUB}</span>.
          </p>
          <Input name="pricePerDay" type="number" label="Custom daily rate (₹)" placeholder="Leave blank for catalog" />
          <Input name="totalRupees" type="number" label="Custom total (₹)" placeholder="Overrides quote" />
          <Input name="depositRupees" type="number" label="Custom deposit (₹)" />
          <Input name="discountRupees" type="number" label="Discount (₹)" placeholder="0" />
          <textarea
            name="internalNotes"
            rows={2}
            placeholder="Staff-only notes"
            className="min-h-[72px] w-full rounded-xl border border-stroke-strong bg-matte/[0.55] px-3 py-2 text-sm text-soft sm:col-span-2"
          />
          <Input name="opsNote" label="Customer-visible ops note" className="sm:col-span-2" />

          <label className="flex items-center gap-2 text-sm text-muted sm:col-span-2">
            <input type="checkbox" name="autoConfirm" className="rounded border-stroke" />
            Auto-confirm (skip pending payment)
          </label>
          <label className="flex items-center gap-2 text-sm text-muted">
            <input type="checkbox" name="vipFlag" className="rounded border-stroke" />
            VIP handling
          </label>
          <label className="flex items-center gap-2 text-sm text-muted">
            <input type="checkbox" name="skipKyc" className="rounded border-stroke" />
            Skip KYC check
          </label>
          {canBypass ? (
            <label className="flex items-center gap-2 text-sm text-amber-200/90 sm:col-span-2">
              <input type="checkbox" name="bypassRestrictions" className="rounded border-stroke" />
              Bypass overlap &amp; availability (audited)
            </label>
          ) : null}

          <div className="sm:col-span-2">
            <Button type="submit" disabled={pending}>
              {pending ? 'Creating…' : 'Create manual booking'}
            </Button>
          </div>
        </form>
        {msg ? <p className="text-sm text-red-300">{msg}</p> : null}
      </AdminCardContent>
    </AdminCard>
  )
}
