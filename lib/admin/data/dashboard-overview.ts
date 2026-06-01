import 'server-only'

import { analyticsRange7dIst, toIstYmd } from '@/lib/admin/analytics-range'
import { fetchCommandCenterBundle, type CommandCenterBundle } from '@/lib/admin/data/command-center'
import { fetchAdminAnalyticsBundle, type AdminAnalyticsBundle } from '@/lib/admin/data/analytics'
import type { AppAuthRole } from '@/lib/auth/roles'
import { hasPermission } from '@/lib/auth/permissions'
import { createAdminClient } from '@/lib/supabase/admin'
import { logPostgrestError } from '@/lib/errors/safe-user-message'

export type DashboardOverviewKpis = {
  totalBookings: number
  activeRentals: number
  revenueTodayRupees: number
  revenueMonthRupees: number
  pendingKyc: number
  availableVehicles: number
  vehiclesMaintenance: number
  pendingRefunds: number
  pendingRefundsRupees: number
  lateReturns: number
  damageClaims: number
}

export type DashboardOverviewBundle = {
  commandCenter: CommandCenterBundle
  kpis: DashboardOverviewKpis
  analytics: AdminAnalyticsBundle | null
  activityFeed: AdminAnalyticsBundle['tables']['recentBookings']
  topVehicles: AdminAnalyticsBundle['tables']['topVehicles']
}

function istTodayYmd(): string {
  return toIstYmd()
}

async function fetchExtendedKpis(
  admin: ReturnType<typeof createAdminClient>,
  today: string,
  commandCenter: CommandCenterBundle,
): Promise<DashboardOverviewKpis> {
  const [
    totalBookingsRes,
    maintenanceRes,
    damageRes,
  ] = await Promise.all([
    admin.from('bookings').select('id', { count: 'exact', head: true }).is('deleted_at', null),
    admin
      .from('vehicles')
      .select('id', { count: 'exact', head: true })
      .is('deleted_at', null)
      .eq('availability_status', 'maintenance'),
    admin
      .from('damage_reports')
      .select('id', { count: 'exact', head: true })
      .in('status', ['reported', 'under_inspection', 'approved']),
  ])

  if (totalBookingsRes.error) logPostgrestError('[dashboardOverview] totalBookings', totalBookingsRes.error)
  if (maintenanceRes.error) logPostgrestError('[dashboardOverview] maintenance', maintenanceRes.error)
  if (damageRes.error) logPostgrestError('[dashboardOverview] damage', damageRes.error)

  const finance = commandCenter.finance
  const fleet = commandCenter.fleet

  return {
    totalBookings: totalBookingsRes.count ?? 0,
    activeRentals: commandCenter.live.activeTrips,
    revenueTodayRupees: finance?.revenueTodayRupees ?? 0,
    revenueMonthRupees: 0,
    pendingKyc: commandCenter.live.pendingKyc,
    availableVehicles: commandCenter.live.availableVehicles,
    vehiclesMaintenance: maintenanceRes.count ?? fleet?.maintenance ?? 0,
    pendingRefunds: finance?.refundsPendingCount ?? 0,
    pendingRefundsRupees: finance?.refundsPendingRupees ?? 0,
    lateReturns: commandCenter.live.overdueReturns,
    damageClaims: damageRes.count ?? 0,
  }
}

export async function fetchDashboardOverviewBundle(role: AppAuthRole): Promise<DashboardOverviewBundle> {
  const commandCenter = await fetchCommandCenterBundle(role)
  const admin = createAdminClient()
  const today = istTodayYmd()

  let kpis = await fetchExtendedKpis(admin, today, commandCenter)

  const canAnalytics = hasPermission(role, 'analytics.read')
  let analytics: AdminAnalyticsBundle | null = null

  if (canAnalytics) {
    analytics = await fetchAdminAnalyticsBundle(analyticsRange7dIst())
    kpis = { ...kpis, revenueMonthRupees: analytics.totals.monthlyRevenue }
  }

  return {
    commandCenter,
    kpis,
    analytics,
    activityFeed: analytics?.tables.recentBookings ?? [],
    topVehicles: analytics?.tables.topVehicles ?? [],
  }
}
