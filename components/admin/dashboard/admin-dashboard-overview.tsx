'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowUpRight, BarChart3, CarFront, ClipboardList, IndianRupee, RotateCcw, Shield, Wrench } from 'lucide-react'

import { AdminCommandCenter } from '@/components/admin/dashboard/admin-command-center'
import {
  AnalyticsDailyBars,
  AnalyticsHorizontalBars,
  AnalyticsSeriesArea,
} from '@/components/admin/analytics/admin-analytics-charts'
import { AdminCard, AdminCardContent } from '@/components/admin/admin-card'
import { AdminStatusPill } from '@/components/admin/admin-status-pill'
import type { DashboardOverviewBundle } from '@/lib/admin/data/dashboard-overview'
import { formatInr } from '@/lib/format'
import { cn } from '@/lib/utils/cn'

const ease = [0.22, 1, 0.36, 1] as const

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04, delayChildren: 0.02 } },
}

const staggerItem = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease } },
}

function EnterpriseKpi({
  label,
  value,
  href,
  tone,
}: {
  label: string
  value: string | number
  href: string
  tone?: 'warn' | 'critical'
}) {
  return (
    <motion.div variants={staggerItem}>
      <Link
        href={href}
        className={cn(
          'group relative block overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.06] via-white/[0.02] to-transparent p-4 shadow-[var(--shadow-card)] transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-accent)]',
          tone === 'warn' && 'border-amber-400/25',
          tone === 'critical' && 'border-rose-400/25',
        )}
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">{label}</p>
        <p className="mt-2 text-xl font-semibold tabular-nums tracking-[-0.03em] text-soft sm:text-2xl">{value}</p>
        <ArrowUpRight className="absolute right-3 top-3 h-4 w-4 text-muted opacity-0 transition-opacity group-hover:opacity-100" />
      </Link>
    </motion.div>
  )
}

export function AdminDashboardOverview({ data }: { data: DashboardOverviewBundle }) {
  const { commandCenter, kpis, analytics, activityFeed, topVehicles } = data
  const showCharts = analytics != null

  return (
    <div className="space-y-10">
      <section aria-label="Enterprise KPIs">
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-electric/90">Executive overview</p>
        <motion.div
          className="grid gap-3 grid-cols-2 lg:grid-cols-5"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <EnterpriseKpi label="Total bookings" value={kpis.totalBookings} href="/admin/bookings" />
          <EnterpriseKpi label="Active rentals" value={kpis.activeRentals} href="/admin/bookings?status=active" />
          <EnterpriseKpi label="Revenue today" value={formatInr(kpis.revenueTodayRupees)} href="/admin/payments" />
          <EnterpriseKpi label="Revenue this month" value={formatInr(kpis.revenueMonthRupees)} href="/admin/analytics" />
          <EnterpriseKpi
            label="Pending KYC"
            value={kpis.pendingKyc}
            href="/admin/kyc"
            tone={kpis.pendingKyc > 0 ? 'warn' : undefined}
          />
          <EnterpriseKpi label="Available vehicles" value={kpis.availableVehicles} href="/admin/fleet" />
          <EnterpriseKpi
            label="Under maintenance"
            value={kpis.vehiclesMaintenance}
            href="/admin/fleet"
            tone={kpis.vehiclesMaintenance > 0 ? 'warn' : undefined}
          />
          <EnterpriseKpi
            label="Pending refunds"
            value={`${kpis.pendingRefunds} refunds / ${formatInr(kpis.pendingRefundsRupees)}`}
            href="/admin/financials"
            tone={kpis.pendingRefunds > 0 ? 'warn' : undefined}
          />
          <EnterpriseKpi
            label="Late returns"
            value={kpis.lateReturns}
            href="/admin/bookings?status=active"
            tone={kpis.lateReturns > 0 ? 'critical' : undefined}
          />
          <EnterpriseKpi
            label="Damage claims"
            value={kpis.damageClaims}
            href="/admin/damage"
            tone={kpis.damageClaims > 0 ? 'warn' : undefined}
          />
        </motion.div>
      </section>

      {showCharts ? (
        <section className="grid gap-6 xl:grid-cols-2" aria-label="Analytics charts">
          <AdminCard>
            <AdminCardContent className="space-y-4 p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Bookings</p>
                  <h2 className="font-display text-base font-semibold text-soft">Booking volume · 7 days</h2>
                </div>
                <BarChart3 className="h-5 w-5 text-electric" aria-hidden />
              </div>
              <AnalyticsDailyBars points={analytics.series.bookingsByDay} color="rgb(59, 130, 246)" />
            </AdminCardContent>
          </AdminCard>
          <AdminCard>
            <AdminCardContent className="space-y-4 p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Revenue</p>
                  <h2 className="font-display text-base font-semibold text-soft">Revenue analytics · 7 days</h2>
                </div>
                <IndianRupee className="h-5 w-5 text-electric" aria-hidden />
              </div>
              <AnalyticsSeriesArea
                points={analytics.series.revenueByDay}
                valueFormatter={(n) => formatInr(n)}
              />
            </AdminCardContent>
          </AdminCard>
          <AdminCard>
            <AdminCardContent className="space-y-4 p-5 sm:p-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Fleet</p>
              <h2 className="font-display text-base font-semibold text-soft">Vehicle utilization</h2>
              <p className="text-sm text-muted">
                Fleet utilization at{' '}
                <span className="font-semibold text-soft">{analytics.totals.fleetUtilizationPct}%</span> in the selected
                period.
              </p>
              <AnalyticsSeriesArea
                points={analytics.series.fleetAvailabilityByDay.map(pt => ({ ...pt, value: 100 - pt.value }))}
                accent="emerald"
                valueFormatter={(n) => `${n}%`}
              />
            </AdminCardContent>
          </AdminCard>
          <AdminCard>
            <AdminCardContent className="space-y-4 p-5 sm:p-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Demand</p>
              <h2 className="font-display text-base font-semibold text-soft">Most booked vehicles</h2>
              <AnalyticsHorizontalBars
                rows={topVehicles.slice(0, 6).map((v) => ({
                  label: v.label,
                  value: v.bookings,
                }))}
                valueLabel={(n) => `${n} bookings`}
              />
            </AdminCardContent>
          </AdminCard>
        </section>
      ) : null}

      {activityFeed.length > 0 ? (
        <AdminCard>
          <AdminCardContent className="space-y-4 p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-semibold text-soft">Customer activity feed</h2>
              <Link href="/admin/bookings" className="text-sm font-medium text-electric hover:underline">
                All bookings
              </Link>
            </div>
            <ul className="divide-y divide-white/[0.06]">
              {activityFeed.map((b) => (
                <li key={b.id}>
                  <Link
                    href={`/admin/bookings/${b.id}`}
                    className="flex flex-wrap items-center justify-between gap-2 py-3 transition-colors hover:bg-white/[0.03]"
                  >
                    <div>
                      <p className="text-sm font-medium text-soft">{b.vehicle_label ?? 'Booking'}</p>
                      <p className="text-xs text-muted">
                        {b.pickup_date.slice(0, 10)} → {b.return_date.slice(0, 10)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <AdminStatusPill value={b.booking_status} />
                      <span className="text-xs tabular-nums text-muted">{formatInr(b.total_rupees)}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </AdminCardContent>
        </AdminCard>
      ) : null}

      <AdminCommandCenter data={commandCenter} />

      <div className="flex flex-wrap gap-2 border-t border-white/[0.06] pt-6">
        <QuickLink href="/admin/bookings" icon={ClipboardList} label="Bookings" />
        <QuickLink href="/admin/fleet" icon={CarFront} label="Fleet" />
        <QuickLink href="/admin/kyc" icon={Shield} label="KYC" />
        <QuickLink href="/admin/damage" icon={Wrench} label="Damage" />
        <QuickLink href="/admin/analytics" icon={BarChart3} label="Reports" />
        <QuickLink href="/admin/bookings?status=active" icon={RotateCcw} label="Late returns" />
      </div>
    </div>
  )
}

function QuickLink({
  href,
  icon: Icon,
  label,
}: {
  href: string
  icon: typeof CarFront
  label: string
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm font-medium text-soft transition-colors hover:border-electric/30 hover:bg-electric/10"
    >
      <Icon className="h-4 w-4 text-electric" aria-hidden />
      {label}
    </Link>
  )
}
