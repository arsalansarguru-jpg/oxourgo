'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { Ban, CircleCheck, Inbox, Search, ShieldCheck, Sparkles } from 'lucide-react'

import { AdminCard, AdminCardContent } from '@/components/admin/admin-card'
import { AdminStatusPill } from '@/components/admin/admin-status-pill'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import {
  adminApproveBookingAction,
  adminCancelBookingAction,
  adminSetBookingStatusAction,
} from '@/lib/admin/actions/booking-actions'
import type { AdminBookingListItem } from '@/lib/admin/data/bookings'
import { formatInr } from '@/lib/format'
import { cn } from '@/lib/utils/cn'

type VehicleSlice = {
  name: string | null
  brand: string | null
  registration_number: string | null
  image: string | null
  transmission: string | null
  fuel_type: string | null
  year: number | null
  seats: number | null
}

function firstVehicle(row: AdminBookingListItem): VehicleSlice | null {
  const v = row.vehicles
  if (!v) return null
  const first = Array.isArray(v) ? v[0] : v
  return first ?? null
}

function vehicleTitle(row: AdminBookingListItem): string {
  const v = firstVehicle(row)
  if (!v) return 'Vehicle'
  const name = v.name?.trim()
  if (name) return name
  const brand = v.brand?.trim()
  return brand || 'Vehicle'
}

function formatShortId(id: string): string {
  return id.replace(/-/g, '').slice(0, 8).toUpperCase()
}

const PAYMENT_FILTER_OPTS = [
  { value: '', label: 'All payments' },
  { value: 'pending', label: 'Pending' },
  { value: 'authorized', label: 'Authorized' },
  { value: 'paid', label: 'Paid' },
  { value: 'failed', label: 'Failed' },
  { value: 'refunded', label: 'Refunded' },
] as const

export function AdminBookingsManager({ rows }: { rows: AdminBookingListItem[] }) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [paymentFilter, setPaymentFilter] = useState<string>('')
  const [actingId, setActingId] = useState<string | null>(null)
  const [banner, setBanner] = useState<{ tone: 'error' | 'success'; text: string } | null>(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((b) => {
      if (paymentFilter && b.payment_status !== paymentFilter) return false
      if (!q) return true
      const v = firstVehicle(b)
      const hay = [
        b.id,
        b.user_id,
        b.customerEmail ?? '',
        b.booking_status,
        b.payment_status,
        b.pickup_location ?? '',
        b.return_location ?? '',
        vehicleTitle(b),
        v?.registration_number ?? '',
        v?.brand ?? '',
        v?.name ?? '',
      ]
        .join(' ')
        .toLowerCase()
      return hay.includes(q)
    })
  }, [rows, search, paymentFilter])

  async function runBookingAction(
    bookingId: string,
    fn: () => Promise<{ ok: true } | { ok: false; message: string }>,
    successHint?: string,
  ) {
    setActingId(bookingId)
    setBanner(null)
    try {
      const r = await fn()
      if (!r.ok) {
        setBanner({ tone: 'error', text: r.message })
        console.error('[AdminBookingsManager]', r.message)
        return
      }
      if (successHint) setBanner({ tone: 'success', text: successHint })
      router.refresh()
    } finally {
      setActingId(null)
    }
  }

  const showServerEmpty = rows.length === 0
  const showFilterEmpty = !showServerEmpty && filtered.length === 0

  return (
    <AdminCard className="overflow-hidden">
      <AdminCardContent className="space-y-4 border-b border-white/[0.06] pb-5 sm:space-y-5 sm:pb-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 flex-1 space-y-2">
            <Input
              label="Search"
              placeholder="Guest, vehicle, registration, booking id, status…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-white/[0.08] bg-white/[0.04] shadow-none theme-light:bg-white/80"
            />
          </div>
          <div className="flex w-full shrink-0 flex-col gap-2 sm:max-w-xs">
            <label htmlFor="admin-bookings-payment" className="text-sm font-medium tracking-[-0.01em] text-muted">
              Payment
            </label>
            <div className="relative">
              <select
                id="admin-bookings-payment"
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className={cn(
                  'h-12 w-full appearance-none rounded-xl border border-stroke-strong bg-matte/[0.55] px-4 pr-10 text-sm font-medium tracking-[-0.01em] text-soft shadow-[inset_0_1px_0_0_color-mix(in_srgb,var(--color-stroke)_35%,transparent)] transition-[border-color,box-shadow,background-color] duration-300 focus:border-electric/55 focus:bg-matte/[0.65] focus:outline-none focus:ring-2 focus:ring-electric/22 theme-light:bg-white/80',
                )}
              >
                {PAYMENT_FILTER_OPTS.map((o) => (
                  <option key={o.value || 'all'} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted">▾</span>
            </div>
          </div>
        </div>

        {banner ? (
          <div
            role="status"
            className={cn(
              'rounded-xl border px-4 py-3 text-sm font-medium tracking-[-0.01em]',
              banner.tone === 'error'
                ? 'border-red-500/30 bg-red-500/10 text-red-100 theme-light:border-red-600/25 theme-light:bg-red-500/8 theme-light:text-red-900'
                : 'border-emerald-500/28 bg-emerald-500/10 text-emerald theme-light:border-emerald-600/25 theme-light:bg-emerald-500/8 theme-light:text-emerald-800',
            )}
          >
            {banner.text}
          </div>
        ) : null}
      </AdminCardContent>

      <div className="relative">
        {showServerEmpty ? (
          <div className="flex flex-col items-center justify-center gap-4 px-6 py-20 text-center sm:py-24">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.09] to-white/[0.02] shadow-[var(--shadow-card)] backdrop-blur-xl ring-1 ring-inset ring-white/[0.04]">
              <Inbox className="h-7 w-7 text-muted" aria-hidden />
            </div>
            <div className="max-w-md space-y-2">
              <p className="text-lg font-semibold tracking-[-0.02em] text-soft">No reservations in this view</p>
              <p className="text-sm leading-relaxed text-muted">
                When guests book vehicles, they will appear here with payment state, fleet assignment, and lifecycle
                controls. Adjust the status chips above or check back shortly.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted backdrop-blur-md theme-light:border-stroke-strong theme-light:bg-white/70">
              <Sparkles className="h-3.5 w-3.5 text-electric" aria-hidden />
              Live Supabase sync
            </div>
          </div>
        ) : showFilterEmpty ? (
          <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center sm:py-20">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.05] backdrop-blur-xl">
              <Search className="h-6 w-6 text-muted" aria-hidden />
            </div>
            <div className="max-w-md space-y-2">
              <p className="text-base font-semibold text-soft">No matches</p>
              <p className="text-sm text-muted">Try a different keyword or reset the payment filter.</p>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                setSearch('')
                setPaymentFilter('')
              }}
            >
              Clear filters
            </Button>
          </div>
        ) : (
          <div className="max-h-[min(72vh,820px)] overflow-auto">
            <table className="w-full min-w-[1080px] text-left text-sm">
              <thead className="sticky top-0 z-20">
                <tr
                  className={cn(
                    'border-b border-white/[0.08] bg-matte/[0.82] backdrop-blur-2xl theme-light:bg-white/[0.92]',
                    'shadow-[0_12px_40px_-28px_rgba(0,0,0,0.75)]',
                  )}
                >
                  <th className="whitespace-nowrap px-4 py-3.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
                    Booking
                  </th>
                  <th className="whitespace-nowrap px-4 py-3.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
                    Customer
                  </th>
                  <th className="min-w-[200px] whitespace-nowrap px-4 py-3.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
                    Vehicle
                  </th>
                  <th className="whitespace-nowrap px-4 py-3.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
                    Trip
                  </th>
                  <th className="whitespace-nowrap px-4 py-3.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
                    Status
                  </th>
                  <th className="whitespace-nowrap px-4 py-3.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
                    Payment
                  </th>
                  <th className="whitespace-nowrap px-4 py-3.5 text-right text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
                    Total
                  </th>
                  <th className="whitespace-nowrap px-4 py-3.5 text-right text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => {
                  const v = firstVehicle(b)
                  const busy = actingId === b.id
                  const canApprove = b.booking_status === 'pending_payment'
                  const canCancel = b.booking_status !== 'cancelled' && b.booking_status !== 'completed'
                  const canComplete = b.booking_status === 'confirmed'

                  return (
                    <tr key={b.id} className="admin-table-row">
                      <td className="px-4 py-3 align-top">
                        <div className="flex flex-col gap-1">
                          <span className="font-mono text-xs font-semibold tracking-wide text-soft">
                            {formatShortId(b.id)}
                          </span>
                          <span className="text-[11px] text-muted">
                            {new Date(b.created_at).toLocaleString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          <Link
                            href={`/admin/bookings/${b.id}`}
                            className="text-xs font-semibold text-electric hover:text-electric/85"
                          >
                            Details →
                          </Link>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex max-w-[220px] flex-col gap-1">
                          <span className="truncate text-sm font-medium text-soft">
                            {b.customerEmail ?? '—'}
                          </span>
                          <Link
                            href={`/admin/customers/${b.user_id}`}
                            className="truncate font-mono text-[11px] text-muted hover:text-electric"
                          >
                            Profile
                          </Link>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex gap-3">
                          <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg border border-white/[0.08] bg-fill-glass-strong">
                            {v?.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={v.image} alt="" className="h-full w-full object-cover" loading="lazy" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-[10px] text-muted">
                                No photo
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 space-y-1">
                            <p className="truncate font-medium text-soft">{vehicleTitle(b)}</p>
                            <p className="truncate text-xs text-muted">
                              {[v?.year, v?.transmission, v?.fuel_type].filter(Boolean).join(' · ') || '—'}
                            </p>
                            {v?.registration_number ? (
                              <p className="font-mono text-[11px] tracking-wide text-muted">{v.registration_number}</p>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top text-muted">
                        <div className="flex flex-col gap-1 text-xs">
                          <span>
                            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted/90">
                              Pickup
                            </span>
                            <br />
                            {new Date(b.pickup_date).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                          </span>
                          <span>
                            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted/90">
                              Return
                            </span>
                            <br />
                            {new Date(b.return_date).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <AdminStatusPill value={b.booking_status} />
                      </td>
                      <td className="px-4 py-3 align-top">
                        <AdminStatusPill value={b.payment_status} />
                      </td>
                      <td className="px-4 py-3 align-top text-right tabular-nums text-sm font-semibold text-soft">
                        {formatInr(b.total_rupees)}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex flex-wrap items-center justify-end gap-1.5">
                          {canApprove ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="primary"
                              className="min-h-9 gap-1 px-3 text-xs"
                              disabled={busy}
                              onClick={() =>
                                runBookingAction(b.id, () => adminApproveBookingAction(b.id), 'Booking approved.')
                              }
                            >
                              <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                              Approve
                            </Button>
                          ) : null}
                          {canComplete ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              className="min-h-9 gap-1 px-3 text-xs"
                              disabled={busy}
                              onClick={() => {
                                if (!window.confirm('Mark this booking as completed?')) return
                                void runBookingAction(
                                  b.id,
                                  () => adminSetBookingStatusAction(b.id, 'completed'),
                                  'Marked completed.',
                                )
                              }}
                            >
                              <CircleCheck className="h-3.5 w-3.5" aria-hidden />
                              Complete
                            </Button>
                          ) : null}
                          {canCancel ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="danger"
                              className="min-h-9 gap-1 px-3 text-xs"
                              disabled={busy}
                              onClick={() => {
                                if (
                                  !window.confirm(
                                    'Cancel this booking? It will move to cancelled and notify workflows where configured.',
                                  )
                                ) {
                                  return
                                }
                                const note = window.prompt('Optional internal note:')?.trim()
                                void runBookingAction(
                                  b.id,
                                  () => adminCancelBookingAction(b.id, note || undefined),
                                  'Booking cancelled.',
                                )
                              }}
                            >
                              <Ban className="h-3.5 w-3.5" aria-hidden />
                              Cancel
                            </Button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminCard>
  )
}
