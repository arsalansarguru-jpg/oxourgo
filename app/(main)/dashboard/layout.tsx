import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { CustomerDashboardShell } from '@/components/dashboard/customer-dashboard-shell'
import { DashboardLayout as DashboardChrome } from '@/components/layout/DashboardLayout'
import { getAuthSessionSummary } from '@/lib/auth/server'
import { isStaffRole } from '@/lib/auth/permissions'
import { countUnreadNotifications, listNotificationsForUser } from '@/lib/customer/notifications-queries'
import { getCustomerProfileSnapshot } from '@/lib/customer/profile-queries'
import { logUnknownError } from '@/lib/errors/safe-user-message'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default async function DashboardRouteLayout({ children }: { children: React.ReactNode }) {
  const summary = await getAuthSessionSummary()
  if (!summary) {
    redirect(`/login?${new URLSearchParams({ redirect: '/dashboard' }).toString()}`)
  }
  const { user } = summary
  const adminConsoleHref = isStaffRole(summary.appRole) ? '/admin' : undefined

  try {
    const profile = await getCustomerProfileSnapshot(user.id)

    const displayName =
      profile.full_name?.trim() ||
      (typeof user.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : null) ||
      user.email?.split('@')[0] ||
      'Member'

    const tier = profile.verification_tier
    const kycLifecycleStatus = profile.kyc_status
    const verificationLabel =
      kycLifecycleStatus === 'approved'
        ? 'Account verified'
        : kycLifecycleStatus === 'rejected' || kycLifecycleStatus === 'resubmission_required'
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
      adminConsoleHref={adminConsoleHref}
      showConciergeFab={!adminConsoleHref}
    >
      <CustomerDashboardShell
        displayName={displayName}
        email={user.email ?? undefined}
        verificationLabel={verificationLabel}
        kycLifecycleStatus={kycLifecycleStatus}
        adminConsoleHref={adminConsoleHref}
      >
        {children}
      </CustomerDashboardShell>
    </DashboardChrome>
    )
  } catch (error) {
    logUnknownError('[dashboard layout]', error)
    return (
      <DashboardChrome
        userId={user.id}
        notificationUnread={0}
        notificationPreview={[]}
        adminConsoleHref={adminConsoleHref}
        showConciergeFab={!adminConsoleHref}
      >
        <CustomerDashboardShell
          displayName={user.email?.split('@')[0] ?? 'Member'}
          email={user.email ?? undefined}
          verificationLabel="Verification in progress"
          kycLifecycleStatus="not_started"
          adminConsoleHref={adminConsoleHref}
        >
          {children}
        </CustomerDashboardShell>
      </DashboardChrome>
    )
  }
}
