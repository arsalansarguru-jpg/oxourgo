'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

import { AdminCard, AdminCardContent } from '@/components/admin/admin-card'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { AdminStatusPill } from '@/components/admin/admin-status-pill'
import { Button } from '@/components/ui/Button'
import { updateSupportTicketStatusAction } from '@/lib/admin/actions/support-actions'
import type { SupportTicketMetrics, SupportTicketRow } from '@/lib/admin/data/support-tickets'

export function AdminSupportDashboard({
  metrics,
  tickets,
}: {
  metrics: SupportTicketMetrics
  tickets: SupportTicketRow[]
}) {
  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Customer success"
        title="Support tickets"
        description="Triaged requests from guests — booking, payment, KYC, damage, and refund inquiries with priority routing."
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricTile label="Open" value={metrics.open} />
        <MetricTile label="In progress" value={metrics.inProgress} />
        <MetricTile label="Urgent" value={metrics.urgent} />
        <MetricTile label="Resolved today" value={metrics.resolvedToday} />
      </div>

      <AdminCard>
        <AdminCardContent className="p-0">
          <div className="scroll-touch overflow-x-auto">
            <table className="w-full min-w-[800px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] text-xs text-muted">
                  <th className="px-4 py-3 font-medium">Subject</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Priority</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tickets.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-muted">
                      No support tickets yet. Customers can raise tickets from the dashboard or via WhatsApp ops.
                    </td>
                  </tr>
                ) : (
                  tickets.map((t) => (
                    <TicketRow key={t.id} ticket={t} />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </AdminCardContent>
      </AdminCard>
    </div>
  )
}

function MetricTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-soft">{value}</p>
    </div>
  )
}

function TicketRow({ ticket }: { ticket: SupportTicketRow }) {
  const router = useRouter()
  const [pending, start] = useTransition()

  return (
    <tr className="border-b border-white/[0.04] align-top hover:bg-white/[0.02]">
      <td className="px-4 py-3">
        <p className="font-medium text-soft">{ticket.subject}</p>
        <p className="mt-1 line-clamp-2 max-w-md text-xs text-muted">{ticket.body}</p>
        {ticket.bookingId ? (
          <Link href={`/admin/bookings/${ticket.bookingId}`} className="mt-1 inline-block text-xs text-electric hover:underline">
            View booking
          </Link>
        ) : null}
      </td>
      <td className="px-4 py-3 text-muted">{ticket.category}</td>
      <td className="px-4 py-3">
        <AdminStatusPill value={ticket.priority} />
      </td>
      <td className="px-4 py-3">
        <AdminStatusPill value={ticket.status} />
      </td>
      <td className="px-4 py-3 text-xs text-muted whitespace-nowrap">
        {new Date(ticket.createdAt).toLocaleString('en-IN')}
      </td>
      <td className="px-4 py-3">
        {ticket.status !== 'resolved' && ticket.status !== 'closed' ? (
          <Button
            size="sm"
            variant="secondary"
            disabled={pending}
            onClick={() => {
              start(async () => {
                const res = await updateSupportTicketStatusAction(ticket.id, 'in_progress')
                if (res.ok) router.refresh()
              })
            }}
          >
            Assign
          </Button>
        ) : null}
      </td>
    </tr>
  )
}
