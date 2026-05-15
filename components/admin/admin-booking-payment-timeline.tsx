import type { PaymentEventRow } from '@/lib/admin/data/payments'
import { formatInr } from '@/lib/format'
import { AdminStatusPill } from '@/components/admin/admin-status-pill'
import { cn } from '@/lib/utils/cn'

export function AdminBookingPaymentTimeline({ events }: { events: PaymentEventRow[] }) {
  if (events.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-stroke-strong bg-matte/[0.25] px-5 py-10 text-center text-sm text-muted">
        No ledger events for this booking yet — collection actions will appear here.
      </div>
    )
  }

  return (
    <ol className="relative space-y-0 border-l border-white/[0.08] pl-6">
      {events.map((e, i) => (
        <li key={e.id} className={cn('pb-8', i === events.length - 1 && 'pb-0')}>
          <span className="absolute -left-[7px] mt-1.5 h-3 w-3 rounded-full border-2 border-electric/60 bg-matte shadow-[0_0_12px_rgba(59,130,246,0.45)]" />
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-medium text-soft">{e.title}</p>
              <p className="mt-1 text-xs text-muted">{new Date(e.created_at).toLocaleString()}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <AdminStatusPill value={e.direction} />
              <AdminStatusPill value={e.status} />
              <span className="tabular-nums text-sm font-semibold text-soft">{formatInr(e.amount_rupees)}</span>
            </div>
          </div>
        </li>
      ))}
    </ol>
  )
}
