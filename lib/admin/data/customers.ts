import 'server-only'

import type { Database } from '@/lib/supabase/database.types'
import { createAdminClient } from '@/lib/supabase/admin'

export type AdminCustomerRow = {
  userId: string
  email: string | null
  createdAt: string
  lastSignInAt: string | null
  profile: Database['public']['Tables']['profiles']['Row'] | null
  bookingCount: number
  cancelledCount: number
  heuristicRisk: number
}

export async function adminListCustomers(): Promise<AdminCustomerRow[]> {
  const admin = createAdminClient()
  const { data: page, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 100 })
  if (listErr || !page?.users?.length) return []

  const ids = page.users.map((u) => u.id)
  const { data: profiles } = await admin.from('profiles').select('*').in('user_id', ids)

  const profileByUser = new Map((profiles ?? []).map((p) => [p.user_id, p]))

  const rows: AdminCustomerRow[] = []
  for (const u of page.users) {
    const { count: total } = await admin
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', u.id)

    const { count: cancelled } = await admin
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', u.id)
      .eq('booking_status', 'cancelled')

    const t = total ?? 0
    const c = cancelled ?? 0
    const heuristicRisk = t === 0 ? 0 : Math.min(100, Math.round((c / t) * 100))

    rows.push({
      userId: u.id,
      email: u.email ?? null,
      createdAt: u.created_at,
      lastSignInAt: u.last_sign_in_at ?? null,
      profile: profileByUser.get(u.id) ?? null,
      bookingCount: t,
      cancelledCount: c,
      heuristicRisk,
    })
  }

  return rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export async function adminGetCustomer(userId: string): Promise<AdminCustomerRow | null> {
  const admin = createAdminClient()
  const { data: userData, error } = await admin.auth.admin.getUserById(userId)
  if (error || !userData?.user) return null
  const u = userData.user

  const { data: profile } = await admin.from('profiles').select('*').eq('user_id', userId).maybeSingle()

  const { count: total } = await admin
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)

  const { count: cancelled } = await admin
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('booking_status', 'cancelled')

  const t = total ?? 0
  const c = cancelled ?? 0
  const heuristicRisk = t === 0 ? 0 : Math.min(100, Math.round((c / t) * 100))

  return {
    userId: u.id,
    email: u.email ?? null,
    createdAt: u.created_at,
    lastSignInAt: u.last_sign_in_at ?? null,
    profile: profile ?? null,
    bookingCount: t,
    cancelledCount: c,
    heuristicRisk,
  }
}
