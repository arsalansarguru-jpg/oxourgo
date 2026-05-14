import { redirect } from 'next/navigation'

import { CustomerDashboardShell } from '@/components/dashboard/customer-dashboard-shell'
import { DashboardLayout as DashboardChrome } from '@/components/layout/DashboardLayout'
import { getAuthenticatedUser } from '@/lib/auth/server'
import { countUnreadNotifications, listNotificationsForUser } from '@/lib/customer/notifications-queries'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardRouteLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthenticatedUser()
  if (!user) {
    redirect(`/login?${new URLSearchParams({ redirect: '/dashboard' }).toString()}`)
  }

  const supabase = await createClient()
  const { data: profile } = await supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle()

  const displayName =
    (profile?.full_name as string | undefined)?.trim() ||
    (typeof user.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : null) ||
    user.email?.split('@')[0] ||
    'Member'

  const tier = (profile?.verification_tier as string | undefined) ?? 'basic'
  const kycLifecycleStatus = (profile?.kyc_status as string | undefined) ?? 'not_started'
  const verificationLabel =
    kycLifecycleStatus === 'approved'
      ? 'Account verified'
      : kycLifecycleStatus === 'rejected'
        ? 'KYC needs your attention'
        : kycLifecycleStatus === 'pending'
          ? 'Verification in review'
          : tier === 'verified'
            ? 'Account verified'
            : tier === 'basic'
              ? 'Verification in progress'
              : 'Complete your profile'

  const [notificationUnread, notificationPreview] = await Promise.all([
    countUnreadNotifications(user.id).catch(() => 0),
    listNotificationsForUser(user.id, 8).catch(() => []),
  ])

  return (
    <DashboardChrome
      userId={user.id}
      notificationUnread={notificationUnread}
      notificationPreview={notificationPreview}
    >
      <CustomerDashboardShell
        displayName={displayName}
        email={user.email ?? undefined}
        verificationLabel={verificationLabel}
        kycLifecycleStatus={kycLifecycleStatus}
      >
        {children}
      </CustomerDashboardShell>
    </DashboardChrome>
  )
}
