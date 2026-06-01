import 'server-only'

import { istDayStartIso, toIstYmd } from '@/lib/admin/analytics-range'
import { createAdminClient } from '@/lib/supabase/admin'
import { logPostgrestError } from '@/lib/errors/safe-user-message'

export type SupportTicketRow = {
  id: string
  userId: string | null
  bookingId: string | null
  subject: string
  body: string
  category: string
  priority: string
  status: string
  assignedTo: string | null
  createdAt: string
  updatedAt: string
  href: string
}

export type SupportTicketMetrics = {
  open: number
  inProgress: number
  urgent: number
  resolvedToday: number
}

export async function adminSupportTicketMetrics(): Promise<SupportTicketMetrics> {
  const admin = createAdminClient()
  const dayStart = istDayStartIso(toIstYmd())

  const [openRes, progressRes, urgentRes, resolvedRes, openChatsRes] = await Promise.all([
    admin.from('support_tickets').select('id', { count: 'exact', head: true }).eq('status', 'open'),
    admin.from('support_tickets').select('id', { count: 'exact', head: true }).eq('status', 'in_progress'),
    admin
      .from('support_tickets')
      .select('id', { count: 'exact', head: true })
      .eq('priority', 'urgent')
      .in('status', ['open', 'in_progress', 'waiting_customer']),
    admin
      .from('support_tickets')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'resolved')
      .gte('resolved_at', dayStart),
    admin.from('support_conversations').select('id', { count: 'exact', head: true }).eq('status', 'open'),
  ])

  for (const res of [openRes, progressRes, urgentRes, resolvedRes, openChatsRes]) {
    if (res.error) logPostgrestError('[supportTickets] metrics', res.error)
  }

  const openTickets = openRes.count ?? 0
  const openChats = openChatsRes.count ?? 0

  return {
    open: openTickets + openChats,
    inProgress: progressRes.count ?? 0,
    urgent: urgentRes.count ?? 0,
    resolvedToday: resolvedRes.count ?? 0,
  }
}

export async function adminListSupportTickets(limit = 100): Promise<SupportTicketRow[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('support_tickets')
    .select('id, user_id, booking_id, subject, body, category, priority, status, assigned_to, created_at, updated_at')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    logPostgrestError('[supportTickets] list', error)
    return []
  }

  return (data ?? []).map((t) => ({
    id: t.id as string,
    userId: (t.user_id as string | null) ?? null,
    bookingId: (t.booking_id as string | null) ?? null,
    subject: (t.subject as string)?.trim() || 'Support request',
    body: (t.body as string)?.trim() || '',
    category: (t.category as string)?.trim() || 'general',
    priority: (t.priority as string)?.trim() || 'normal',
    status: (t.status as string)?.trim() || 'open',
    assignedTo: (t.assigned_to as string | null) ?? null,
    createdAt: t.created_at as string,
    updatedAt: t.updated_at as string,
    href: t.booking_id ? `/admin/bookings/${t.booking_id}` : '/admin/support',
  }))
}
