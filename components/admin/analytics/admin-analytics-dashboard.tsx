'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowUpRight,
  BarChart3,
  CalendarRange,
  CarFront,
  Gauge,
  IndianRupee,
  Percent,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react'

import {
  AnalyticsAvailabilityLine,
  AnalyticsDailyBars,
  AnalyticsHorizontalBars,
  AnalyticsSeriesArea,
} from '@/components/admin/analytics/admin-analytics-charts'
import { AnalyticsRangeFilter } from '@/components/admin/analytics/analytics-range-filter'
import { AdminCard, AdminCardContent } from '@/components/admin/admin-card'
import { AdminStatusPill } from '@/components/admin/admin-status-pill'
import type { AdminAnalyticsBundle } from '@/lib/admin/data/analytics'
import { formatInr } from '@/lib/format'
import { cn } from '@/lib/utils/cn'

const ease = [0.22, 1, 0.36, 1] as const

function MetricGlass({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string
  value: string
  hint?: string
  icon: typeof IndianRupee
}) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.07] via-white/[0.02] to-transparent p-5 shadow-[var(--shadow-card)] ring-1 ring-inset ring-white/[0.04]',
        'before:pointer-events-none before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-br before:from-electric/10 before:via-transparent before:to-transparent before:opacity-60',
      )}
    >
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">{label}</p>
          <p className="text-2xl font-semibold tabular-nums tracking-[-0.04em] text-soft sm:text-[1.65rem]">{value}</p>
          {hint ? <p className="text-[11px] leading-relaxed text-muted">{hint}</p> : null}
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.05] text-electric shadow-[0_0_20px_-6px_rgba(59,130,246,0.45)]">
          <Icon className="h-5 w-5" aria-hidden />
        </div>
      </div>
    </div>
  )
}

const staggerParent = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
}

const staggerParentLoose = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.12 } },
}

const section = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease } },
}

export function AdminAnalyticsDashboard({ data }: { data: AdminAnalyticsBundle }) {
  const { range, totals, series, tables, truncatedBookings } = data

  return (
    <motion.div
      key={`${range.startIso}-${range.endIso}`}
      className="space-y-8 lg:space-y-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease }}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-electric/90">Intelligence</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-soft sm:text-4xl">Analytics</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
            Live revenue, fleet load, and booking momentum from Supabase — scoped to{' '}
            <span className="font-medium text-soft">{range.label}</span> ({range.startDay} → {range.endDay} UTC).
          </p>
        </div>
        <Sparkles className="hidden h-10 w-10 text-electric/40 lg:block" aria-hidden />
      </div>

      <AnalyticsRangeFilter range={range} />

      {totals.bookingsCreatedInPeriod === 0 && totals.periodRevenue === 0 ? (
        <div
          className="flex flex-col gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-5 py-6 text-sm text-muted shadow-[var(--shadow-card)] backdrop-blur-md sm:flex-row sm:items-center sm:gap-4 theme-light:border-stroke-strong theme-light:bg-white/80"
          role="status"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.05] text-electric">
            <BarChart3 className="h-6 w-6" aria-hidden />
          </div>
          <div className="min-w-0 space-y-1">
            <p className="font-semibold text-soft">No booking activity in this range</p>
            <p className="text-xs leading-relaxed text-muted">
              Charts and leaderboards need at least one reservation created in the selected window. Widen the date range
              or return once guests begin booking.
            </p>
          </div>
        </div>
      ) : null}

      {truncatedBookings ? (
        <div className="rounded-xl border border-amber-400/25 bg-amber-500/[0.08] px-4 py-3 text-sm text-amber-100/95">
          Dataset capped for performance — totals and charts reflect loaded rows only. Narrow the date range for full
          fidelity on very high volume.
        </div>
      ) : null}

      <motion.div
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        initial="hidden"
        animate="visible"
        variants={staggerParent}
      >
        <motion.div variants={section}>
          <MetricGlass
            label="Total revenue (posted)"
            value={formatInr(totals.totalRevenueLifetime)}
            hint="Lifetime rental collected (received + partial), excl. cancelled"
            icon={IndianRupee}
          />
        </motion.div>
        <motion.div variants={section}>
          <MetricGlass
            label="Month-to-date revenue"
            value={formatInr(totals.monthlyRevenue)}
            hint="UTC calendar month · same posting rules"
            icon={TrendingUp}
          />
        </motion.div>
        <motion.div variants={section}>
          <MetricGlass
            label="Period revenue"
            value={formatInr(totals.periodRevenue)}
            hint="In selected window"
            icon={IndianRupee}
          />
        </motion.div>
        <motion.div variants={section}>
          <MetricGlass
            label="Active bookings"
            value={String(totals.activeBookings)}
            hint="On hire today (confirmed / pending payment)"
            icon={CalendarRange}
          />
        </motion.div>
      </motion.div>

      <motion.div
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        initial="hidden"
        animate="visible"
        variants={staggerParentLoose}
      >
        <motion.div variants={section}>
          <MetricGlass
            label="Fleet utilization"
            value={`${totals.fleetUtilizationPct}%`}
            hint="Avg share of bookable fleet on-trip across the window"
            icon={Gauge}
          />
        </motion.div>
        <motion.div variants={section}>
          <MetricGlass label="Pending KYC" value={String(totals.pendingKyc)} hint="Awaiting review" icon={ShieldCheck} />
        </motion.div>
        <motion.div variants={section}>
          <MetricGlass
            label="Total customers"
            value={String(totals.totalCustomers)}
            hint="Profiles in system"
            icon={Users}
          />
        </motion.div>
        <motion.div variants={section} className="sm:col-span-2 lg:col-span-3">
          <MetricGlass
            label="Booking conversion"
            value={`${totals.conversionPct}%`}
            hint={`Confirmed or completed vs ${totals.bookingsCreatedInPeriod} bookings created in this range`}
            icon={Percent}
          />
        </motion.div>
      </motion.div>

      <div className="grid gap-6 xl:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease, delay: 0.08 }}
        >
          <AdminCard className="overflow-hidden">
            <AdminCardContent className="space-y-4 p-6 sm:p-8">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-electric/90">Ledger</p>
                  <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-soft">Revenue over time</h2>
                  <p className="mt-1 text-xs text-muted">Posted totals by booking creation day (UTC).</p>
                </div>
                <Link
                  href="/admin/payments"
                  className="inline-flex items-center gap-1 text-xs font-medium text-electric hover:underline"
                >
                  Payments <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                </Link>
              </div>
              <AnalyticsSeriesArea points={series.revenueByDay} valueFormatter={formatInr} accent="electric" />
            </AdminCardContent>
          </AdminCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease, delay: 0.08 }}
        >
          <AdminCard className="overflow-hidden">
            <AdminCardContent className="space-y-4 p-6 sm:p-8">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-electric/90">Pipeline</p>
                <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-soft">Booking trends</h2>
                <p className="mt-1 text-xs text-muted">New reservations created per day.</p>
              </div>
              <AnalyticsDailyBars points={series.bookingsByDay} color="rgba(59,130,246,0.55)" />
            </AdminCardContent>
          </AdminCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease, delay: 0.08 }}
        >
          <AdminCard>
            <AdminCardContent className="space-y-4 p-6 sm:p-8">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-electric/90">Fleet</p>
                  <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-soft">Most booked vehicles</h2>
                  <p className="mt-1 text-xs text-muted">By booking count in the selected window.</p>
                </div>
                <Link href="/admin/fleet" className="text-xs font-medium text-electric hover:underline">
                  Fleet <ArrowUpRight className="inline h-3.5 w-3.5" aria-hidden />
                </Link>
              </div>
              {tables.topVehicles.length === 0 ? (
                <p className="text-sm text-muted">No vehicle-level bookings in this window.</p>
              ) : (
                <AnalyticsHorizontalBars
                  rows={tables.topVehicles.map((v) => ({ label: v.label, value: v.bookings }))}
                  valueLabel={(n) => `${n} trips`}
                />
              )}
            </AdminCardContent>
          </AdminCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease, delay: 0.08 }}
        >
          <AdminCard>
            <AdminCardContent className="space-y-4 p-6 sm:p-8">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-electric/90">Capacity</p>
                <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-soft">Fleet availability</h2>
                <p className="mt-1 text-xs text-muted">
                  Share of bookable vehicles without an overlapping confirmed / pending trip.
                </p>
              </div>
              <AnalyticsAvailabilityLine points={series.fleetAvailabilityByDay} />
            </AdminCardContent>
          </AdminCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease, delay: 0.2 }}
          className="xl:col-span-2"
        >
          <AdminCard>
            <AdminCardContent className="space-y-4 p-6 sm:p-8">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-electric/90">Growth</p>
                <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-soft">Customer signups</h2>
                <p className="mt-1 text-xs text-muted">New profiles created per day (UTC).</p>
              </div>
              <AnalyticsSeriesArea
                points={series.newCustomersByDay}
                accent="emerald"
                valueFormatter={(n) => String(Math.round(n))}
              />
            </AdminCardContent>
          </AdminCard>
        </motion.div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <AdminCard className="lg:col-span-3">
          <AdminCardContent className="p-0">
            <div className="border-b border-white/[0.06] px-6 py-4 sm:px-8">
              <h2 className="text-lg font-semibold text-soft">Recent bookings</h2>
              <p className="text-xs text-muted">Latest in the selected window.</p>
            </div>
            <div className="overflow-x-auto scroll-touch">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                  <tr className="border-b border-white/[0.06]">
                    <th className="px-6 py-3 sm:px-8">When</th>
                    <th className="px-4 py-3">Vehicle</th>
                    <th className="px-4 py-3">Trip</th>
                    <th className="px-4 py-3">Total</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-6 py-3 sm:px-8" />
                  </tr>
                </thead>
                <tbody>
                  {tables.recentBookings.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-muted sm:px-8">
                        No bookings in this range.
                      </td>
                    </tr>
                  ) : (
                    tables.recentBookings.map((b) => (
                      <tr key={b.id} className="border-b border-white/[0.04] last:border-0">
                        <td className="px-6 py-3 text-xs text-muted sm:px-8">
                          {new Date(b.created_at).toLocaleString()}
                        </td>
                        <td className="max-w-[200px] truncate px-4 py-3 text-soft">{b.vehicle_label ?? '—'}</td>
                        <td className="px-4 py-3 text-xs text-muted">
                          {b.pickup_date} → {b.return_date}
                        </td>
                        <td className="px-4 py-3 tabular-nums text-soft">{formatInr(b.total_rupees)}</td>
                        <td className="px-4 py-3">
                          <AdminStatusPill value={b.booking_status} />
                        </td>
                        <td className="px-6 py-3 text-right sm:px-8">
                          <Link
                            href={`/admin/bookings/${b.id}`}
                            className="text-xs font-medium text-electric hover:underline"
                          >
                            Open
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </AdminCardContent>
        </AdminCard>

        <AdminCard className="lg:col-span-1">
          <AdminCardContent className="space-y-3 p-6 sm:p-8">
            <h2 className="text-lg font-semibold text-soft">Top customers</h2>
            <p className="text-xs text-muted">Posted revenue in window.</p>
            <ul className="space-y-3">
              {tables.topCustomers.length === 0 ? (
                <li className="text-sm text-muted">No posted spend in this window.</li>
              ) : (
                tables.topCustomers.map((c) => (
                  <li
                    key={c.user_id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-soft">{c.full_name ?? 'Member'}</p>
                      <p className="truncate font-mono text-[10px] text-muted">{c.user_id.slice(0, 8)}…</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold tabular-nums text-soft">{formatInr(c.revenue)}</p>
                      <Link href={`/admin/customers/${c.user_id}`} className="text-[10px] font-medium text-electric hover:underline">
                        Profile
                      </Link>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </AdminCardContent>
        </AdminCard>

        <AdminCard className="lg:col-span-2">
          <AdminCardContent className="space-y-4 p-6 sm:p-8">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-soft">Most rented vehicles</h2>
                <p className="text-xs text-muted">Posted revenue and trip volume in window.</p>
              </div>
            </div>
            <div className="overflow-x-auto scroll-touch">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                  <tr className="border-b border-white/[0.06]">
                    <th className="py-2 pr-4">Vehicle</th>
                    <th className="py-2 pr-4">Trips</th>
                    <th className="py-2">Posted revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {tables.topVehicles.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-6 text-muted">
                        No data.
                      </td>
                    </tr>
                  ) : (
                    tables.topVehicles.map((v) => (
                      <tr key={v.vehicle_id} className="border-b border-white/[0.04] last:border-0">
                        <td className="py-2.5 pr-4">
                          <span className="inline-flex items-center gap-2">
                            <CarFront className="h-4 w-4 text-electric/80" aria-hidden />
                            <span className="font-medium text-soft">{v.label}</span>
                          </span>
                        </td>
                        <td className="py-2.5 pr-4 tabular-nums text-muted">{v.bookings}</td>
                        <td className="py-2.5 tabular-nums text-soft">{formatInr(v.revenue)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </AdminCardContent>
        </AdminCard>
      </div>
    </motion.div>
  )
}
