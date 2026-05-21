import Link from 'next/link'

import { AdminBookingsManager } from '@/components/admin/bookings/admin-bookings-manager'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { adminListBookingsPage } from '@/lib/admin/data/bookings'
import { cn } from '@/lib/utils/cn'

export const dynamic = 'force-dynamic'

const STATUS_TABS = [
  { label: 'All', param: '' },
  { label: 'Pending', param: 'pending_payment' },
  { label: 'Approved', param: 'confirmed' },
  { label: 'On trip', param: 'active' },
  { label: 'Completed', param: 'completed' },
  { label: 'Cancelled', param: 'cancelled' },
] as const

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const

function parseIntSafe(v: string | undefined, fallback: number): number {
  const n = Number.parseInt(String(v ?? ''), 10)
  return Number.isFinite(n) ? n : fallback
}

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; payment?: string; source?: string; q?: string; page?: string; per?: string }>
}) {
  const q = await searchParams
  const rawStatus = typeof q.status === 'string' ? q.status.trim() : ''
  const status = rawStatus || undefined
  const allowedStatus = !status || STATUS_TABS.some((f) => f.param === status)
  const safeStatus = allowedStatus && status ? status : undefined

  const rawPayment = typeof q.payment === 'string' ? q.payment.trim() : ''
  const payment = rawPayment || undefined
  const allowedPayment =
    !payment || ['pending', 'received', 'partial', 'refunded'].includes(payment)
  const safePayment = allowedPayment && payment ? payment : undefined

  const rawSource = typeof q.source === 'string' ? q.source.trim() : ''
  const source = rawSource || undefined
  const allowedSource = !source || ['website', 'whatsapp', 'admin_manual'].includes(source)
  const safeSource = allowedSource && source ? source : undefined

  const searchRaw = typeof q.q === 'string' ? q.q.trim().slice(0, 160) : ''
  const search = searchRaw || undefined

  const page = Math.max(1, parseIntSafe(q.page, 1))
  const perRaw = parseIntSafe(q.per, 25)
  const pageSize = PAGE_SIZE_OPTIONS.includes(perRaw as (typeof PAGE_SIZE_OPTIONS)[number]) ? perRaw : 25

  let pageResult: Awaited<ReturnType<typeof adminListBookingsPage>> = {
    rows: [],
    totalCount: 0,
    page: 1,
    pageSize: 25,
    dataError: null,
  }
  let loadError: string | null = null

  try {
    pageResult = await adminListBookingsPage({
      page,
      pageSize,
      booking_status: safeStatus,
      payment_status: safePayment,
      booking_source: safeSource,
      search,
    })
  } catch (e) {
    console.error('[AdminBookingsPage]', e)
    loadError = 'Unable to load bookings. Please try again in a moment.'
  }

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Bookings"
        title="Reservations"
        description="Production console for every reservation — Supabase-backed pagination, lifecycle actions, and payment filters aligned with your schema."
      />

      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((f) => {
          const params = new URLSearchParams()
          if (f.param) params.set('status', f.param)
          if (safePayment) params.set('payment', safePayment)
          if (safeSource) params.set('source', safeSource)
          if (search) params.set('q', search)
          if (pageSize !== 25) params.set('per', String(pageSize))
          const qs = params.toString()
          const href = qs ? `/admin/bookings?${qs}` : '/admin/bookings'
          const active = (safeStatus ?? '') === (f.param || '')
          return (
            <Link
              key={f.label}
              href={href}
              className={cn(
                'rounded-full border px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] transition-[background-color,border-color,color,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
                active
                  ? 'border-electric/45 bg-electric/18 text-electric shadow-[0_0_24px_-10px_rgba(59,130,246,0.55)]'
                  : 'border-white/[0.08] bg-white/[0.03] text-muted hover:border-white/[0.12] hover:bg-white/[0.055] hover:text-soft theme-light:border-stroke-strong theme-light:bg-white/70',
              )}
            >
              {f.label}
            </Link>
          )
        })}
      </div>

      <AdminBookingsManager
        pageResult={pageResult}
        listQuery={{
          status: safeStatus ?? '',
          payment: safePayment ?? '',
          source: safeSource ?? '',
          q: search ?? '',
          page: pageResult.page,
          pageSize: pageResult.pageSize,
        }}
        loadError={loadError}
        dataError={pageResult.dataError}
      />
    </div>
  )
}
