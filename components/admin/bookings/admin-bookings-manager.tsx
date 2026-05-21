'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import {
  Ban,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Inbox,
  Loader2,
  Play,
  Search,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'

import { BookingSourceBadge } from '@/components/admin/bookings/booking-source-badge'
import { AdminBookingsBulkPdfBar } from '@/components/admin/admin-bookings-bulk-pdf-bar'
import { AdminCard, AdminCardContent } from '@/components/admin/admin-card'
import { AdminStatusPill } from '@/components/admin/admin-status-pill'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import {
  adminApproveBookingAction,
  adminCancelBookingAction,
  adminMarkBookingActiveAction,
  adminMarkCompletedAction,
  adminMarkHandedOverAction,
  adminMarkReturnedAction,
} from '@/lib/admin/actions/booking-actions'
import {
  bookingVehicleTitle,
  firstBookingVehicle,
  formatShortBookingId,
} from '@/lib/admin/bookings-display'
import { stringifyBookingsQuery } from '@/lib/admin/bookings-list-url'
import type { AdminBookingListItem, AdminBookingsPageResult } from '@/lib/admin/data/bookings'
import { fleetVehicleImageUrl } from '@/lib/admin/fleet-image-url'
import { formatInr } from '@/lib/format'
import { cn } from '@/lib/utils/cn'

const PAYMENT_FILTER_OPTS = [
  { value: '', label: 'All payments' },
  { value: 'pending', label: 'Pending' },
  { value: 'partial', label: 'Partial' },
  { value: 'received', label: 'Received' },
  { value: 'refunded', label: 'Refunded' },
] as const

const SOURCE_FILTER_OPTS = [
  { value: '', label: 'All channels' },
  { value: 'website', label: 'Website' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'admin_manual', label: 'Admin manual' },
] as const

const PAGE_SIZE_OPTS = [10, 25, 50, 100] as const

export type AdminBookingsManagerProps = {
  pageResult: AdminBookingsPageResult
  listQuery: {
    status: string
    payment: string
    source: string
    q: string
    page: number
    pageSize: number
  }
  loadError: string | null
  dataError?: string | null
}

function customerDisplayName(row: AdminBookingListItem): string {
  const n = row.customerFullName?.trim()
  if (n) return n
  const email = row.customerEmail?.trim()
  if (email) return email.split('@')[0] ?? email
  return 'Guest'
}

function buildBookingsListHref(
  current: AdminBookingsManagerProps['listQuery'],
  patch: Partial<{ status: string; payment: string; source: string; q: string; page: number; per: number }>,
) {
  const status = patch.status !== undefined ? patch.status : current.status
  const payment = patch.payment !== undefined ? patch.payment : current.payment
  const source = patch.source !== undefined ? patch.source : current.source
  const q = patch.q !== undefined ? patch.q : current.q
  const page = patch.page !== undefined ? patch.page : current.page
  const per = patch.per !== undefined ? patch.per : current.pageSize

  return `/admin/bookings${stringifyBookingsQuery({
    status: status || undefined,
    payment: payment || undefined,
    source: source || undefined,
    q: q || undefined,
    page: page > 1 ? page : undefined,
    per: per !== 25 ? per : undefined,
  })}`
}

export function AdminBookingsManager({ pageResult, listQuery, loadError, dataError }: AdminBookingsManagerProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()
  const [actingId, setActingId] = useState<string | null>(null)
  const [banner, setBanner] = useState<{ tone: 'error' | 'success'; text: string } | null>(null)
  const [draftQ, setDraftQ] = useState(listQuery.q)

  useEffect(() => {
    setDraftQ(listQuery.q)
  }, [listQuery.q])

  const { rows, totalCount, page, pageSize } = pageResult
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  const paymentHref = (payment: string) =>
    buildBookingsListHref(listQuery, {
      payment,
      page: 1,
    })

  const sourceHref = (source: string) =>
    buildBookingsListHref(listQuery, {
      source,
      page: 1,
    })

  const pageHref = (p: number) =>
    buildBookingsListHref(listQuery, {
      page: p,
    })

  function refresh() {
    startTransition(() => {
      router.refresh()
    })
  }

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
      refresh()
    } finally {
      setActingId(null)
    }
  }

  const dataLoadGap = !loadError && totalCount > 0 && rows.length === 0
  const showEmpty = !loadError && !dataLoadGap && totalCount === 0
  const showRows = !loadError && rows.length > 0

  return (
    <AdminCard className="overflow-hidden">
      <AdminCardContent className="space-y-4 border-b border-white/[0.06] pb-5 sm:space-y-5 sm:pb-6">
        <form
          className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"
          onSubmit={(e) => {
            e.preventDefault()
            const next = draftQ.trim()
            router.push(
              `${pathname}${stringifyBookingsQuery({
                status: listQuery.status || undefined,
                payment: listQuery.payment || undefined,
                source: listQuery.source || undefined,
                q: next || undefined,
                page: 1,
                per: listQuery.pageSize !== 25 ? listQuery.pageSize : undefined,
              })}`,
            )
          }}
        >
          <div className="min-w-0 flex-1 space-y-2">
            <Input
              label="Search"
              placeholder="Guest name, email, locations, vehicle, booking id…"
              value={draftQ}
              onChange={(e) => setDraftQ(e.target.value)}
              className="border-white/[0.08] bg-white/[0.04] shadow-none theme-light:bg-white/80"
            />
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Button type="submit" className="w-full gap-2 sm:w-auto" disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Search className="h-4 w-4" aria-hidden />}
              Apply
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="w-full sm:w-auto"
              disabled={isPending}
              onClick={() => {
                setDraftQ('')
                router.push(
                  `${pathname}${stringifyBookingsQuery({
                    status: listQuery.status || undefined,
                    payment: listQuery.payment || undefined,
                    source: listQuery.source || undefined,
                    page: 1,
                    per: listQuery.pageSize !== 25 ? listQuery.pageSize : undefined,
                  })}`,
                )
              }}
            >
              Clear search
            </Button>
          </div>
        </form>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <span className="w-full text-[11px] font-semibold uppercase tracking-[0.14em] text-muted sm:w-auto sm:py-2">
              Payment
            </span>
            {PAYMENT_FILTER_OPTS.map((o) => {
              const active = (listQuery.payment || '') === o.value
              return (
                <Link
                  key={o.value || 'all'}
                  href={paymentHref(o.value)}
                  className={cn(
                    'inline-flex min-h-9 items-center rounded-full border px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] transition-colors duration-300',
                    active
                      ? 'border-electric/45 bg-electric/18 text-electric'
                      : 'border-white/[0.08] bg-white/[0.03] text-muted hover:border-white/[0.12] hover:text-soft theme-light:border-stroke-strong theme-light:bg-white/70',
                  )}
                >
                  {o.label}
                </Link>
              )
            })}
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="w-full text-[11px] font-semibold uppercase tracking-[0.14em] text-muted sm:w-auto sm:py-2">
              Channel
            </span>
            {SOURCE_FILTER_OPTS.map((o) => {
              const active = (listQuery.source || '') === o.value
              return (
                <Link
                  key={o.value || 'all-src'}
                  href={sourceHref(o.value)}
                  className={cn(
                    'inline-flex min-h-9 items-center rounded-full border px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] transition-colors duration-300',
                    active
                      ? 'border-emerald-400/45 bg-emerald-500/18 text-emerald-300 theme-light:text-emerald-800'
                      : 'border-white/[0.08] bg-white/[0.03] text-muted hover:border-white/[0.12] hover:text-soft theme-light:border-stroke-strong theme-light:bg-white/70',
                  )}
                >
                  {o.label}
                </Link>
              )
            })}
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <label htmlFor="bookings-per-page" className="text-xs font-medium text-muted">
              Per page
            </label>
            <select
              id="bookings-per-page"
              value={String(pageSize)}
              disabled={isPending}
              onChange={(e) => {
                const per = Number(e.target.value)
                router.push(
                  `${pathname}${stringifyBookingsQuery({
                    status: listQuery.status || undefined,
                    payment: listQuery.payment || undefined,
                    source: listQuery.source || undefined,
                    q: listQuery.q || undefined,
                    page: 1,
                    per: per !== 25 ? per : undefined,
                  })}`,
                )
              }}
              className={cn(
                'h-11 min-h-11 w-full rounded-xl border border-stroke-strong bg-matte/[0.55] px-3 text-base font-medium text-soft theme-light:bg-white/80 sm:h-10 sm:min-h-10 sm:w-auto sm:min-w-[4.5rem] sm:text-sm',
                'focus:border-electric/55 focus:outline-none focus:ring-2 focus:ring-electric/22',
              )}
            >
              {PAGE_SIZE_OPTS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loadError ? (
          <div
            role="alert"
            className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-100 theme-light:border-red-600/25 theme-light:bg-red-500/8 theme-light:text-red-900"
          >
            {loadError}
          </div>
        ) : null}

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

        <p className="text-xs text-muted">
          Showing{' '}
          <span className="font-semibold text-soft">
            {totalCount === 0 ? 0 : (page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalCount)}
          </span>{' '}
          of <span className="font-semibold text-soft">{totalCount}</span> bookings
        </p>

        {showRows ? <AdminBookingsBulkPdfBar bookingIds={rows.map((b) => b.id)} className="mt-4" /> : null}
      </AdminCardContent>

      <div className="relative">
        {isPending ? (
          <div
            className="absolute inset-0 z-30 flex items-center justify-center rounded-b-2xl bg-matte/55 backdrop-blur-sm theme-light:bg-white/60"
            aria-busy="true"
            aria-label="Refreshing"
          >
            <Loader2 className="h-8 w-8 animate-spin text-electric" />
          </div>
        ) : null}

        {dataLoadGap ? (
          <div className="flex flex-col items-center justify-center gap-4 px-6 py-20 text-center sm:py-24">
            <div className="max-w-md space-y-2">
              <p className="text-lg font-semibold tracking-[-0.02em] text-soft">Could not load reservation rows</p>
              <p className="text-sm leading-relaxed text-muted">
                Supabase reports {totalCount} matching booking{totalCount === 1 ? '' : 's'}, but the table query failed.
                {dataError ? ` ${dataError}` : ' Check server logs or set OXOUR_ADMIN_DATA_DEBUG=1.'}
              </p>
            </div>
            <Button type="button" size="sm" variant="secondary" onClick={() => refresh()}>
              Retry
            </Button>
          </div>
        ) : showEmpty ? (
          <div className="flex flex-col items-center justify-center gap-4 px-6 py-20 text-center sm:py-24">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.09] to-white/[0.02] shadow-[var(--shadow-card)] backdrop-blur-xl ring-1 ring-inset ring-white/[0.04]">
              <Inbox className="h-7 w-7 text-muted" aria-hidden />
            </div>
            <div className="max-w-md space-y-2">
              <p className="text-lg font-semibold tracking-[-0.02em] text-soft">No reservations match</p>
              <p className="text-sm leading-relaxed text-muted">
                Adjust status tabs, payment filters, or search. All bookings are loaded from Supabase with server-side
                pagination.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted backdrop-blur-md theme-light:border-stroke-strong theme-light:bg-white/70">
              <Sparkles className="h-3.5 w-3.5 text-electric" aria-hidden />
              Live Supabase sync
            </div>
          </div>
        ) : showRows ? (
          <>
            <div className="admin-table-scroll hidden max-h-[min(72vh,860px)] overflow-auto lg:block">
              <table className="w-full min-w-[1180px] text-left text-sm">
                <thead className="sticky top-0 z-20">
                  <tr
                    className={cn(
                      'border-b border-white/[0.08] bg-matte/[0.82] backdrop-blur-2xl theme-light:bg-white/[0.92]',
                      'shadow-[0_12px_40px_-28px_rgba(0,0,0,0.75)]',
                    )}
                  >
                    {['Booking', 'Customer', 'Vehicle', 'Pickup', 'Return', 'Total', 'Booking', 'Payment', 'Actions'].map(
                      (h) => (
                        <th
                          key={h}
                          className={cn(
                            'whitespace-nowrap px-4 py-3.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted',
                            (h === 'Total' || h === 'Actions') && 'text-right',
                          )}
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((b) => {
                    const v = firstBookingVehicle(b)
                    const thumb = fleetVehicleImageUrl(v?.image ?? null)
                    const busy = actingId === b.id
                    const canApprove = b.booking_status === 'pending_payment'
                    const canMarkActive = b.booking_status === 'pending_payment'
                    const canCancel = b.booking_status !== 'cancelled' && b.booking_status !== 'completed'
                    const canHandOver = b.booking_status === 'confirmed'
                    const canReturn = b.booking_status === 'active' && !b.returned_at
                    const canComplete = b.booking_status === 'active'

                    return (
                      <tr key={b.id} className="admin-table-row">
                        <td className="px-4 py-3 align-top">
                          <div className="flex flex-col gap-1">
                            <span className="font-mono text-xs font-semibold tracking-wide text-soft">
                              {formatShortBookingId(b.id)}
                            </span>
                            <span className="text-[11px] text-muted">
                              {new Date(b.created_at).toLocaleString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            <BookingSourceBadge source={b.booking_source} />
                            <Link
                              href={`/admin/bookings/${b.id}`}
                              className="text-xs font-semibold text-electric hover:text-electric/85"
                            >
                              Details →
                            </Link>
                          </div>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <div className="flex max-w-[220px] flex-col gap-0.5">
                            <span className="truncate text-sm font-medium text-soft">{customerDisplayName(b)}</span>
                            <span className="truncate text-xs text-muted">{b.customerEmail ?? '—'}</span>
                            <Link
                              href={`/admin/customers/${b.user_id}`}
                              className="truncate text-[11px] font-medium text-electric hover:underline"
                            >
                              Profile
                            </Link>
                          </div>
                        </td>
                        <td className="min-w-[200px] px-4 py-3 align-top">
                          <div className="flex gap-3">
                            <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg border border-white/[0.08] bg-fill-glass-strong">
                              {thumb ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={thumb} alt="" className="h-full w-full object-cover" loading="lazy" />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-[10px] text-muted">
                                  —
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 space-y-1">
                              <p className="truncate font-medium text-soft">{bookingVehicleTitle(b)}</p>
                              <p className="truncate text-xs text-muted">
                                {[v?.year, v?.transmission, v?.fuel_type].filter(Boolean).join(' · ') || '—'}
                              </p>
                              {v?.registration_number ? (
                                <p className="font-mono text-[11px] tracking-wide text-muted">{v.registration_number}</p>
                              ) : null}
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 align-top text-xs text-muted">
                          {new Date(b.pickup_date).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 align-top text-xs text-muted">
                          {new Date(b.return_date).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                        </td>
                        <td className="px-4 py-3 align-top text-right tabular-nums text-sm font-semibold text-soft">
                          {formatInr(b.total_rupees)}
                        </td>
                        <td className="px-4 py-3 align-top">
                          <AdminStatusPill value={b.booking_status} />
                        </td>
                        <td className="px-4 py-3 align-top">
                          <AdminStatusPill value={b.payment_status} />
                        </td>
                        <td className="px-4 py-3 align-top">
                          <div className="flex flex-col items-end gap-1.5">
                            {canApprove ? (
                              <Button
                                type="button"
                                size="sm"
                                variant="primary"
                                className="min-h-8 w-full max-w-[9.5rem] gap-1 px-2.5 text-[11px]"
                                disabled={busy || isPending}
                                onClick={() =>
                                  runBookingAction(b.id, () => adminApproveBookingAction(b.id), 'Booking approved.')
                                }
                              >
                                <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden />
                                Approve
                              </Button>
                            ) : null}
                            {canMarkActive ? (
                              <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                className="min-h-8 w-full max-w-[9.5rem] gap-1 px-2.5 text-[11px]"
                                disabled={busy || isPending}
                                onClick={() =>
                                  runBookingAction(
                                    b.id,
                                    () => adminMarkBookingActiveAction(b.id),
                                    'Booking marked active.',
                                  )
                                }
                              >
                                <Play className="h-3.5 w-3.5 shrink-0" aria-hidden />
                                Mark active
                              </Button>
                            ) : null}
                            {canHandOver ? (
                              <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                className="min-h-8 w-full max-w-[9.5rem] gap-1 px-2.5 text-[11px]"
                                disabled={busy || isPending}
                                onClick={() =>
                                  runBookingAction(b.id, () => adminMarkHandedOverAction(b.id), 'Marked handed over.')
                                }
                              >
                                Hand over
                              </Button>
                            ) : null}
                            {canReturn ? (
                              <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                className="min-h-8 w-full max-w-[9.5rem] gap-1 px-2.5 text-[11px]"
                                disabled={busy || isPending}
                                onClick={() =>
                                  runBookingAction(b.id, () => adminMarkReturnedAction(b.id), 'Return logged.')
                                }
                              >
                                Mark returned
                              </Button>
                            ) : null}
                            {canComplete ? (
                              <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                className="min-h-8 w-full max-w-[9.5rem] gap-1 px-2.5 text-[11px]"
                                disabled={busy || isPending}
                                onClick={() => {
                                  if (!window.confirm('Mark this trip as completed?')) return
                                  void runBookingAction(
                                    b.id,
                                    () => adminMarkCompletedAction(b.id),
                                    'Trip completed.',
                                  )
                                }}
                              >
                                <CircleCheck className="h-3.5 w-3.5 shrink-0" aria-hidden />
                                Complete
                              </Button>
                            ) : null}
                            {canCancel ? (
                              <Button
                                type="button"
                                size="sm"
                                variant="danger"
                                className="min-h-8 w-full max-w-[9.5rem] gap-1 px-2.5 text-[11px]"
                                disabled={busy || isPending}
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
                                <Ban className="h-3.5 w-3.5 shrink-0" aria-hidden />
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

            <div className="divide-y divide-white/[0.06] lg:hidden">
              {rows.map((b) => {
                const v = firstBookingVehicle(b)
                const thumb = fleetVehicleImageUrl(v?.image ?? null)
                const busy = actingId === b.id
                const canApprove = b.booking_status === 'pending_payment'
                const canMarkActive = b.booking_status === 'pending_payment'
                const canCancel = b.booking_status !== 'cancelled' && b.booking_status !== 'completed'
                const canHandOver = b.booking_status === 'confirmed'
                const canReturn = b.booking_status === 'active' && !b.returned_at
                const canComplete = b.booking_status === 'active'

                return (
                  <div key={b.id} className="space-y-4 p-4 sm:p-5">
                    <div className="flex gap-3">
                      <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-xl border border-white/[0.08]">
                        {thumb ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={thumb} alt="" className="h-full w-full object-cover" loading="lazy" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs text-muted">—</div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-soft">{bookingVehicleTitle(b)}</p>
                        <p className="text-xs text-muted">{customerDisplayName(b)}</p>
                        <p className="truncate text-xs text-muted">{b.customerEmail ?? '—'}</p>
                        <p className="mt-1 font-mono text-[11px] text-muted">{formatShortBookingId(b.id)}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <AdminStatusPill value={b.booking_status} />
                      <AdminStatusPill value={b.payment_status} />
                      <BookingSourceBadge source={b.booking_source} />
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted">
                      <div>
                        <span className="font-semibold text-soft/90">Pickup</span>
                        <br />
                        {new Date(b.pickup_date).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                      </div>
                      <div>
                        <span className="font-semibold text-soft/90">Return</span>
                        <br />
                        {new Date(b.return_date).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                      </div>
                    </div>
                    <p className="text-sm font-semibold tabular-nums text-soft">{formatInr(b.total_rupees)}</p>
                    <div className="flex flex-wrap gap-2">
                      {canApprove ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="primary"
                          className="min-h-9 flex-1 gap-1 text-xs"
                          disabled={busy || isPending}
                          onClick={() =>
                            runBookingAction(b.id, () => adminApproveBookingAction(b.id), 'Booking approved.')
                          }
                        >
                          <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                          Approve
                        </Button>
                      ) : null}
                      {canMarkActive ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          className="min-h-9 flex-1 gap-1 text-xs"
                          disabled={busy || isPending}
                          onClick={() =>
                            runBookingAction(b.id, () => adminMarkBookingActiveAction(b.id), 'Booking marked active.')
                          }
                        >
                          <Play className="h-3.5 w-3.5" aria-hidden />
                          Active
                        </Button>
                      ) : null}
                      {canHandOver ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          className="min-h-9 flex-1 gap-1 text-xs"
                          disabled={busy || isPending}
                          onClick={() =>
                            runBookingAction(b.id, () => adminMarkHandedOverAction(b.id), 'Marked handed over.')
                          }
                        >
                          Hand over
                        </Button>
                      ) : null}
                      {canReturn ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          className="min-h-9 flex-1 gap-1 text-xs"
                          disabled={busy || isPending}
                          onClick={() =>
                            runBookingAction(b.id, () => adminMarkReturnedAction(b.id), 'Return logged.')
                          }
                        >
                          Returned
                        </Button>
                      ) : null}
                      {canComplete ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          className="min-h-9 flex-1 gap-1 text-xs"
                          disabled={busy || isPending}
                          onClick={() => {
                            if (!window.confirm('Mark this trip as completed?')) return
                            void runBookingAction(b.id, () => adminMarkCompletedAction(b.id), 'Trip completed.')
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
                          className="min-h-9 flex-1 gap-1 text-xs"
                          disabled={busy || isPending}
                          onClick={() => {
                            if (!window.confirm('Cancel this booking?')) return
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
                      <Button type="button" size="sm" variant="outline" className="min-h-9 flex-1 text-xs" to={`/admin/bookings/${b.id}`}>
                        Details
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="flex flex-col items-center justify-between gap-4 border-t border-white/[0.06] px-4 py-4 sm:flex-row sm:px-6">
              <p className="text-xs text-muted">
                Page <span className="font-semibold text-soft">{page}</span> of{' '}
                <span className="font-semibold text-soft">{totalPages}</span>
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {page > 1 ? (
                  <Button type="button" variant="secondary" size="sm" className="gap-1" disabled={isPending} to={pageHref(page - 1)}>
                    <ChevronLeft className="h-4 w-4" aria-hidden />
                    Prev
                  </Button>
                ) : (
                  <span className="inline-flex min-h-9 items-center gap-1 rounded-xl border border-white/[0.06] px-3 py-2 text-sm font-semibold text-muted opacity-40 theme-light:border-stroke">
                    <ChevronLeft className="h-4 w-4" aria-hidden />
                    Prev
                  </span>
                )}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let p = i + 1
                  if (totalPages > 5) {
                    const start = Math.max(1, Math.min(page - 2, totalPages - 4))
                    p = start + i
                  }
                  if (p > totalPages) return null
                  const active = p === page
                  return (
                    <Link
                      key={p}
                      href={pageHref(p)}
                      className={cn(
                        'flex h-9 min-w-9 items-center justify-center rounded-lg border px-2 text-sm font-semibold transition-colors',
                        active
                          ? 'border-electric/45 bg-electric/18 text-electric'
                          : 'border-white/[0.08] bg-white/[0.03] text-muted hover:border-white/[0.12] hover:text-soft theme-light:border-stroke-strong theme-light:bg-white/70',
                      )}
                    >
                      {p}
                    </Link>
                  )
                })}
                {page < totalPages ? (
                  <Button type="button" variant="secondary" size="sm" className="gap-1" disabled={isPending} to={pageHref(page + 1)}>
                    Next
                    <ChevronRight className="h-4 w-4" aria-hidden />
                  </Button>
                ) : (
                  <span className="inline-flex min-h-9 items-center gap-1 rounded-xl border border-white/[0.06] px-3 py-2 text-sm font-semibold text-muted opacity-40 theme-light:border-stroke">
                    Next
                    <ChevronRight className="h-4 w-4" aria-hidden />
                  </span>
                )}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </AdminCard>
  )
}
