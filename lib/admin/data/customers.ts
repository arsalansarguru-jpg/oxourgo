import 'server-only'

import type { Database } from '@/lib/supabase/database.types'
import { resolveCustomerDisplayName } from '@/lib/customer/display-name'
import { createAdminClient } from '@/lib/supabase/admin'
import { logPostgrestError, logUnknownError } from '@/lib/errors/safe-user-message'

export type AdminCustomerRow = {
  userId: string
  displayName: string
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
  if (listErr) {
    logUnknownError('[adminListCustomers] auth.listUsers', listErr)
    return []
  }
  if (!page?.users?.length) return []

  const ids = page.users.map((u) => u.id)
  const { data: profiles, error: profilesErr } = await admin.from('profiles').select('*').in('user_id', ids)
  if (profilesErr) {
    logPostgrestError('[adminListCustomers] profiles', profilesErr)
  }

  const profileByUser = new Map((profiles ?? []).map((p) => [p.user_id, p]))

  const rows: AdminCustomerRow[] = []
  for (const u of page.users) {
    const { count: total, error: totalErr } = await admin
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', u.id)
      .is('deleted_at', null)

    const { count: cancelled, error: cancelledErr } = await admin
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', u.id)
      .is('deleted_at', null)
      .eq('booking_status', 'cancelled')

    if (totalErr) logPostgrestError('[adminListCustomers] bookings.total', totalErr)
    if (cancelledErr) logPostgrestError('[adminListCustomers] bookings.cancelled', cancelledErr)

    const t = total ?? 0
    const c = cancelled ?? 0
    const heuristicRisk = t === 0 ? 0 : Math.min(100, Math.round((c / t) * 100))

    const profile = profileByUser.get(u.id)
    const meta = u.user_metadata as { full_name?: string; name?: string; display_name?: string } | undefined
    rows.push({
      userId: u.id,
      displayName: resolveCustomerDisplayName({
        userId: u.id,
        fullName: profile?.full_name ?? null,
        displayName: (profile as { display_name?: string | null } | null)?.display_name ?? null,
        email: u.email ?? null,
        phone: profile?.phone ?? null,
        authMetadata: meta ?? null,
      }),
      email: u.email ?? null,
      createdAt: u.created_at,
      lastSignInAt: u.last_sign_in_at ?? null,
      profile: profile ?? null,
      bookingCount: t,
      cancelledCount: c,
      heuristicRisk,
    })
  }

  return rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export async function adminGetCustomer(userId: string): Promise<AdminCustomerRow | null> {
  const admin = createAdminClient()
  const { data: userData, error: userErr } = await admin.auth.admin.getUserById(userId)
  if (userErr) {
    logUnknownError('[adminGetCustomer] auth.getUserById', userErr)
    return null
  }
  if (!userData?.user) return null
  const u = userData.user

  const { data: profile, error: profileErr } = await admin.from('profiles').select('*').eq('user_id', userId).maybeSingle()
  if (profileErr) {
    logPostgrestError('[adminGetCustomer] profiles', profileErr)
  }

  const { count: total, error: totalErr } = await admin
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .is('deleted_at', null)

  const { count: cancelled, error: cancelledErr } = await admin
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .is('deleted_at', null)
    .eq('booking_status', 'cancelled')

  if (totalErr) logPostgrestError('[adminGetCustomer] bookings.total', totalErr)
  if (cancelledErr) logPostgrestError('[adminGetCustomer] bookings.cancelled', cancelledErr)

  const t = total ?? 0
  const c = cancelled ?? 0
  const heuristicRisk = t === 0 ? 0 : Math.min(100, Math.round((c / t) * 100))

  const meta = u.user_metadata as { full_name?: string; name?: string; display_name?: string } | undefined
  return {
    userId: u.id,
    displayName: resolveCustomerDisplayName({
      userId: u.id,
      fullName: profile?.full_name ?? null,
      displayName: (profile as { display_name?: string | null } | null)?.display_name ?? null,
      email: u.email ?? null,
      phone: profile?.phone ?? null,
      authMetadata: meta ?? null,
    }),
    email: u.email ?? null,
    createdAt: u.created_at,
    lastSignInAt: u.last_sign_in_at ?? null,
    profile: profile ?? null,
    bookingCount: t,
    cancelledCount: c,
    heuristicRisk,
  }
}
