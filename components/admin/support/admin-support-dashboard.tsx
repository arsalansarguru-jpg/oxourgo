'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

import { AdminCard, AdminCardContent } from '@/components/admin/admin-card'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { AdminStatusPill } from '@/components/admin/admin-status-pill'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import {
  adminReplySupportConversationAction,
  updateSupportTicketStatusAction,
} from '@/lib/admin/actions/support-actions'
import type { AdminSupportConversationItem } from '@/lib/admin/data/support-conversations'
import type { SupportTicketMetrics, SupportTicketRow } from '@/lib/admin/data/support-tickets'

export function AdminSupportDashboard({
  metrics,
  tickets,
  conversations,
}: {
  metrics: SupportTicketMetrics
  tickets: SupportTicketRow[]
  conversations: AdminSupportConversationItem[]
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
          <div className="border-b border-white/[0.06] px-4 py-3">
            <h2 className="text-sm font-semibold text-soft">Live chat threads</h2>
            <p className="mt-1 text-xs text-muted">Messages from the customer support page — reply to continue the thread.</p>
          </div>
          <div className="scroll-touch overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] text-xs text-muted">
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Last message</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Updated</th>
                  <th className="px-4 py-3 font-medium">Reply</th>
                </tr>
              </thead>
              <tbody>
                {conversations.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-muted">
                      No saved chat threads yet. Customers can message from /support when signed in.
                    </td>
                  </tr>
                ) : (
                  conversations.map((c) => <ConversationRow key={c.id} item={c} />)
                )}
              </tbody>
            </table>
          </div>
        </AdminCardContent>
      </AdminCard>

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
                      No formal tickets yet. Customers reach support via live chat, WhatsApp, or email.
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

function ConversationRow({ item }: { item: AdminSupportConversationItem }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [reply, setReply] = useState('')

  return (
    <tr className="border-b border-white/[0.04] align-top hover:bg-white/[0.02]">
      <td className="px-4 py-3 font-medium text-soft">{item.customerLabel}</td>
      <td className="max-w-xs px-4 py-3 text-xs text-muted">
        <p className="line-clamp-2">{item.lastMessagePreview ?? '—'}</p>
      </td>
      <td className="px-4 py-3">
        <AdminStatusPill value={item.status} />
      </td>
      <td className="px-4 py-3 text-xs text-muted whitespace-nowrap">
        {new Date(item.lastMessageAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
      </td>
      <td className="px-4 py-3">
        <form
          className="flex min-w-[200px] gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            const text = reply.trim()
            if (!text || pending) return
            start(async () => {
              const res = await adminReplySupportConversationAction(item.id, text)
              if (res.ok) {
                setReply('')
                router.refresh()
              }
            })
          }}
        >
          <Input
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Staff reply…"
            aria-label="Reply to customer"
            className="min-w-0 flex-1"
            disabled={pending}
          />
          <Button type="submit" size="sm" variant="secondary" disabled={pending || !reply.trim()}>
            Send
          </Button>
        </form>
      </td>
    </tr>
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
