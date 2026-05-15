'use client'

import Link from 'next/link'
import { MessageCircle } from 'lucide-react'

import { AdminCard, AdminCardContent } from '@/components/admin/admin-card'
import { AdminStatusPill } from '@/components/admin/admin-status-pill'
import type { AdminWhatsAppConversationListItem } from '@/lib/admin/data/whatsapp'
import { cn } from '@/lib/utils/cn'

export function AdminWhatsAppConversations({
  conversations,
  whatsappBookingsCount,
}: {
  conversations: AdminWhatsAppConversationListItem[]
  whatsappBookingsCount: number
}) {
  return (
    <div className="space-y-6">
      <AdminCard>
        <AdminCardContent className="space-y-2">
          <p className="text-sm text-muted">
            Active WhatsApp threads share the same Supabase database as the website — bookings, availability, KYC, and
            payments flow through the unified admin console.
          </p>
          <p className="text-xs text-muted">
            <span className="font-semibold text-soft">{whatsappBookingsCount}</span> reservation
            {whatsappBookingsCount === 1 ? '' : 's'} attributed to WhatsApp.
          </p>
        </AdminCardContent>
      </AdminCard>

      <AdminCard className="overflow-hidden">
        <AdminCardContent className="p-0">
          {conversations.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-muted">
              No conversations yet. They appear when customers message via the WhatsApp webhook or when ops opens a
              thread.
            </p>
          ) : (
            <ul className="divide-y divide-white/[0.06]">
              {conversations.map((c) => (
                <li key={c.id} className="px-5 py-4 transition-colors hover:bg-white/[0.02]">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <MessageCircle className="h-4 w-4 text-emerald-400" aria-hidden />
                        <span className="font-medium text-soft">
                          {c.contact.full_name?.trim() || c.contact.e164}
                        </span>
                        <AdminStatusPill value={c.flow_state} />
                        <span
                          className={cn(
                            'rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
                            c.status === 'active'
                              ? 'border-emerald-400/30 text-emerald-300'
                              : 'border-white/[0.1] text-muted',
                          )}
                        >
                          {c.status}
                        </span>
                      </div>
                      <p className="font-mono text-xs text-muted">{c.contact.e164}</p>
                      {c.contact.user_id ? (
                        <Link href={`/admin/customers/${c.contact.user_id}`} className="text-xs font-medium text-electric">
                          View customer →
                        </Link>
                      ) : (
                        <p className="text-xs text-amber-200/90 theme-light:text-amber-800">
                          Account not linked — link before creating a booking.
                        </p>
                      )}
                    </div>
                    <div className="shrink-0 text-right text-xs text-muted">
                      <p>Updated {new Date(c.updated_at).toLocaleString()}</p>
                      {c.active_booking_id ? (
                        <Link href={`/admin/bookings/${c.active_booking_id}`} className="mt-1 inline-block text-electric">
                          Active booking →
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </AdminCardContent>
      </AdminCard>
    </div>
  )
}
