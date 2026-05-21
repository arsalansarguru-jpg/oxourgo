import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { CustomerDashboardShell } from '@/components/dashboard/customer-dashboard-shell'
import { DashboardLayout as DashboardChrome } from '@/components/layout/DashboardLayout'
import { debugLogRoleResolution } from '@/lib/auth/role-debug'
import { getAuthSessionSummary } from '@/lib/auth/server'
import { isStaffRole } from '@/lib/auth/permissions'
import { ADMIN_HOME } from '@/lib/auth/routes'
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

  debugLogRoleResolution('dashboard/layout', {
    userId: user.id,
    email: user.email,
    app_metadata: user.app_metadata,
    user_metadata: user.user_metadata,
    resolved: summary.appRole,
    isStaff: isStaffRole(summary.appRole),
  })

  if (isStaffRole(summary.appRole)) {
    redirect(ADMIN_HOME)
  }

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
  } catch (error) {
    logUnknownError('[dashboard layout]', error)
    return (
      <DashboardChrome userId={user.id} notificationUnread={0} notificationPreview={[]}>
        <CustomerDashboardShell
          displayName={user.email?.split('@')[0] ?? 'Member'}
          email={user.email ?? undefined}
          verificationLabel="Verification in progress"
          kycLifecycleStatus="not_started"
        >
          {children}
        </CustomerDashboardShell>
      </DashboardChrome>
    )
  }
}
