import Link from 'next/link'
import { FileText } from 'lucide-react'

import { AdminCard, AdminCardContent } from '@/components/admin/admin-card'

const LINKS = [
  { doc: 'confirmation' as const, label: 'Booking confirmation' },
  { doc: 'invoice' as const, label: 'Rental invoice' },
  { doc: 'summary' as const, label: 'Trip summary' },
]

export function AdminBookingPdfPanel({ bookingId }: { bookingId: string }) {
  return (
    <AdminCard>
      <AdminCardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-electric" aria-hidden />
          <h2 className="text-lg font-semibold tracking-[-0.02em] text-soft">PDF export</h2>
        </div>
        <p className="text-sm text-muted">
          Download signed-style documents for this reservation. Files open as PDF downloads.
        </p>
        <ul className="flex flex-col gap-2">
          {LINKS.map((l) => (
            <li key={l.doc}>
              <Link
                href={`/api/admin/bookings/${bookingId}/pdf?doc=${l.doc}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm font-medium text-soft transition hover:border-electric/35 hover:bg-electric/10 theme-light:border-stroke-strong theme-light:bg-white/70"
              >
                <span>{l.label}</span>
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-electric">Download</span>
              </Link>
            </li>
          ))}
        </ul>
      </AdminCardContent>
    </AdminCard>
  )
}
