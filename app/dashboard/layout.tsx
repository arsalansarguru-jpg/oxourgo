import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { CustomerDashboardShell } from '@/components/dashboard/customer-dashboard-shell'
import { KycStatusProvider } from '@/components/providers/kyc-status-provider'
import { DashboardLayout as DashboardChrome } from '@/components/layout/DashboardLayout'
import { debugLogRoleResolution } from '@/lib/auth/role-debug'
import { getAuthSessionSummary } from '@/lib/auth/server'
import { isStaffRole } from '@/lib/auth/permissions'
import { ADMIN_HOME } from '@/lib/auth/routes'
import { countUnreadNotifications, listNotificationsForUser } from '@/lib/customer/notifications-queries'
import { resolveCustomerDisplayName } from '@/lib/customer/display-name'
import { getCustomerProfileSnapshot } from '@/lib/customer/profile-queries'
import { listKycDocuments } from '@/lib/customer/kyc-queries'
import { buildKycUiSnapshot } from '@/lib/kyc/kyc-ui-snapshot'
import { isProfileKycApprovedForBooking } from '@/lib/kyc/kyc-booking-eligible'
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
    const [profile, kycDocs] = await Promise.all([
      getCustomerProfileSnapshot(user.id),
      listKycDocuments(user.id).catch(() => []),
    ])

    const meta = user.user_metadata as { full_name?: string; name?: string; display_name?: string } | undefined
    const displayName = resolveCustomerDisplayName({
      userId: user.id,
      fullName: profile.full_name,
      displayName: profile.display_name,
      email: user.email ?? null,
      phone: profile.phone ?? null,
      authMetadata: meta ?? null,
    })

    const kycUi = buildKycUiSnapshot({
      profileKycStatus: profile.kyc_status,
      docs: kycDocs,
      bookingCleared: isProfileKycApprovedForBooking(profile),
    })

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
      <KycStatusProvider value={kycUi}>
        <CustomerDashboardShell
          displayName={displayName}
          email={user.email ?? undefined}
          verificationLabel={kycUi.sidebarLabel}
          kycLifecycleStatus={kycUi.lifecycleStatus}
        >
          {children}
        </CustomerDashboardShell>
      </KycStatusProvider>
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
