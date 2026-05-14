'use client'

import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import {
  ArrowUpRight,
  CalendarClock,
  CarFront,
  CreditCard,
  Gauge,
  IndianRupee,
  Layers,
  Radio,
  Shield,
  Sparkles,
  TrendingUp,
} from 'lucide-react'

import { AdminCard, AdminCardContent } from '@/components/admin/admin-card'
import { AdminStatusPill } from '@/components/admin/admin-status-pill'
import { Button } from '@/components/ui/Button'
import { formatInr } from '@/lib/format'
import { cn } from '@/lib/utils/cn'
import {
  dashboardActivityFeed,
  dashboardDummyMetrics,
  dashboardFleetStatus,
  dashboardRecentBookings,
  dashboardRevenueSecondary,
  dashboardRevenueSeries,
  dashboardUpcomingPickups,
  dashboardVehicleAvailability,
} from '@/lib/admin/dashboard-dummy-data'

const ease = [0.22, 1, 0.36, 1] as const

const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.04 },
  },
}

const staggerItem = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease } },
}

const sectionReveal = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease } },
}

function DeltaBadge({ pct }: { pct: number }) {
  const pos = pct >= 0
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums',
        pos ? 'bg-emerald/12 text-emerald' : 'bg-rose-500/12 text-rose-200',
      )}
    >
      {pos ? '+' : ''}
      {pct.toFixed(1)}%
    </span>
  )
}

function HeroMetric({
  label,
  value,
  sub,
  delta,
  icon: Icon,
  href,
}: {
  label: string
  value: string
  sub?: string
  delta: number
  icon: LucideIcon
  href: string
}) {
  return (
    <Link href={href} className="group block outline-none">
      <AdminCard className="relative h-full overflow-hidden p-6 transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-accent)]">
        <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-electric/12 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />
        <div className="relative flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">{label}</p>
            <p className="text-[1.65rem] font-semibold leading-none tracking-[-0.04em] text-soft sm:text-3xl lg:text-[2.1rem]">
              {value}
            </p>
            {sub ? <p className="text-xs text-muted">{sub}</p> : null}
          </div>
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.05] text-electric shadow-[0_0_24px_-8px_rgba(59,130,246,0.45)] transition-transform duration-300 group-hover:scale-105">
            <Icon className="h-5 w-5" aria-hidden />
          </div>
        </div>
        <div className="relative mt-5 flex flex-wrap items-center gap-2">
          <DeltaBadge pct={delta} />
          <span className="text-[11px] text-muted">vs last period</span>
          <ArrowUpRight className="ml-auto h-4 w-4 text-muted opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:translate-y-[-2px] group-hover:opacity-100" />
        </div>
      </AdminCard>
    </Link>
  )
}

function buildAreaPath(
  values: readonly number[],
  width: number,
  height: number,
  padX: number,
  padY: number,
): { line: string; area: string } {
  if (values.length === 0) return { line: '', area: '' }
  const max = Math.max(...values)
  const min = Math.min(...values) * 0.92
  const span = max - min || 1
  const innerW = width - padX * 2
  const innerH = height - padY * 2
  const pts = values.map((v, i) => {
    const x = padX + (i / Math.max(values.length - 1, 1)) * innerW
    const y = padY + innerH - ((v - min) / span) * innerH
    return [x, y] as const
  })
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')
  const baseY = height - padY
  const area = `M ${pts[0][0].toFixed(1)} ${baseY.toFixed(1)} ${pts.map((p) => `L ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')} L ${pts[pts.length - 1][0].toFixed(1)} ${baseY.toFixed(1)} Z`
  return { line, area }
}

function RevenueTrendChart() {
  const values = dashboardRevenueSeries.map((d) => d.value)
  const w = 640
  const h = 220
  const pad = 28
  const { line, area } = buildAreaPath([...values], w, h, pad, pad)

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${w} ${h}`} className="h-[220px] w-full overflow-visible" aria-hidden>
        <defs>
          <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgb(59, 130, 246)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="rgb(59, 130, 246)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="revStroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgb(96, 165, 250)" />
            <stop offset="100%" stopColor="rgb(59, 130, 246)" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3].map((i) => (
          <line
            key={i}
            x1={pad}
            y1={pad + (i * (h - pad * 2)) / 3}
            x2={w - pad}
            y2={pad + (i * (h - pad * 2)) / 3}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="1"
          />
        ))}
        <path d={area} fill="url(#revFill)" className="transition-opacity duration-500" />
        <path
          d={line}
          fill="none"
          stroke="url(#revStroke)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="drop-shadow-[0_0_12px_rgba(59,130,246,0.35)]"
        />
        {dashboardRevenueSeries.map((d, i) => {
          const max = Math.max(...values)
          const min = Math.min(...values) * 0.92
          const span = max - min || 1
          const innerW = w - pad * 2
          const innerH = h - pad * 2
          const x = pad + (i / Math.max(dashboardRevenueSeries.length - 1, 1)) * innerW
          const y = pad + innerH - ((d.value - min) / span) * innerH
          return <circle key={d.label} cx={x} cy={y} r="4" fill="#0a0a0c" stroke="rgb(59, 130, 246)" strokeWidth="2" />
        })}
      </svg>
      <div className="mt-2 flex justify-between px-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
        {dashboardRevenueSeries.map((d) => (
          <span key={d.label}>{d.label}</span>
        ))}
      </div>
    </div>
  )
}

function MiniBarCompare() {
  const bars = [
    { label: 'Target', pct: 100, muted: true },
    { label: 'Actual', pct: dashboardRevenueSecondary.targetAttainmentPct, muted: false },
  ]
  return (
    <div className="space-y-4">
      {bars.map((b) => (
        <div key={b.label}>
          <div className="flex justify-between text-[11px] font-medium text-muted">
            <span>{b.label}</span>
            <span className="tabular-nums text-soft">{b.pct}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[0.06]">
            <motion.div
              className={cn('h-full rounded-full', b.muted ? 'bg-white/[0.12]' : 'bg-gradient-to-r from-electric/80 to-electric')}
              initial={{ width: 0 }}
              whileInView={{ width: `${Math.min(b.pct, 100)}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, ease }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

export function AdminDashboardHome() {
  const m = dashboardDummyMetrics

  return (
    <motion.div
      className="space-y-8 lg:space-y-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease }}
    >
      <motion.div
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={staggerItem}>
          <HeroMetric
            label="Total revenue"
            value={formatInr(m.totalRevenue)}
            sub="Gross · last 30 days"
            delta={m.revenueDeltaPct}
            icon={IndianRupee}
            href="/admin/analytics"
          />
        </motion.div>
        <motion.div variants={staggerItem}>
          <HeroMetric
            label="Active bookings"
            value={String(m.activeBookings)}
            sub="Vehicles on hire + confirmed"
            delta={m.bookingsDeltaPct}
            icon={CreditCard}
            href="/admin/bookings"
          />
        </motion.div>
        <motion.div variants={staggerItem}>
          <HeroMetric
            label="Fleet utilization"
            value={`${m.fleetUtilizationPct}%`}
            sub="Rolling 7-day window"
            delta={m.utilizationDeltaPct}
            icon={Gauge}
            href="/admin/fleet"
          />
        </motion.div>
        <motion.div variants={staggerItem}>
          <HeroMetric
            label="Pending KYC"
            value={String(m.pendingKyc)}
            sub="Awaiting review"
            delta={m.kycDeltaPct}
            icon={Shield}
            href="/admin/kyc"
          />
        </motion.div>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-12">
        <motion.div
          className="lg:col-span-8"
          variants={sectionReveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.12 }}
        >
          <AdminCard>
            <AdminCardContent className="p-6 sm:p-8">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-electric/90">Revenue</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-soft sm:text-3xl">Performance</h2>
                  <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
                    Trailing eight-month trend · figures illustrative until live ledger sync.
                  </p>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-[11px] font-medium text-muted">
                  <TrendingUp className="h-3.5 w-3.5 text-emerald" aria-hidden />
                  <span className="text-soft">Strong Q4 uplift</span>
                </div>
              </div>
              <div className="mt-8">
                <RevenueTrendChart />
              </div>
            </AdminCardContent>
          </AdminCard>
        </motion.div>

        <motion.div
          className="flex flex-col gap-6 lg:col-span-4"
          variants={sectionReveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.12 }}
        >
          <AdminCard>
            <AdminCardContent className="space-y-6">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">Yield</p>
                <p className="mt-2 text-3xl font-semibold tabular-nums tracking-[-0.04em] text-soft">
                  {dashboardRevenueSecondary.collectionRatePct}%
                </p>
                <p className="mt-1 text-xs text-muted">Collection rate · settled vs issued</p>
              </div>
              <div className="h-px bg-white/[0.06]" />
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">Avg booking</p>
                <p className="mt-2 text-2xl font-semibold tabular-nums tracking-[-0.03em] text-soft">
                  {formatInr(dashboardRevenueSecondary.avgBookingValue)}
                </p>
                <p className="mt-1 text-xs text-muted">Blended · self-drive + chauffeur mix</p>
              </div>
              <MiniBarCompare />
            </AdminCardContent>
          </AdminCard>
        </motion.div>
      </div>

      <motion.div
        variants={sectionReveal}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.08 }}
      >
        <AdminCard className="overflow-hidden">
          <AdminCardContent className="p-0">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.06] px-6 py-5 sm:px-8">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">Pipeline</p>
                <h2 className="mt-1.5 text-xl font-semibold tracking-[-0.03em] text-soft sm:text-2xl">Recent bookings</h2>
              </div>
              <Button variant="secondary" size="sm" to="/admin/bookings">
                View all
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="admin-table-head">
                  <tr>
                    <th className="px-6 py-3.5 font-medium sm:px-8">Reference</th>
                    <th className="px-6 py-3.5 font-medium sm:px-8">Guest</th>
                    <th className="px-6 py-3.5 font-medium sm:px-8">Vehicle</th>
                    <th className="px-6 py-3.5 font-medium sm:px-8">Pickup</th>
                    <th className="px-6 py-3.5 font-medium sm:px-8">Status</th>
                    <th className="px-6 py-3.5 text-right font-medium sm:px-8">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardRecentBookings.map((row) => (
                    <tr key={row.id} className="admin-table-row">
                      <td className="px-6 py-3.5 font-mono text-xs text-muted sm:px-8">{row.id}</td>
                      <td className="px-6 py-3.5 font-medium text-soft sm:px-8">{row.guest}</td>
                      <td className="px-6 py-3.5 text-muted sm:px-8">{row.vehicle}</td>
                      <td className="px-6 py-3.5 text-muted sm:px-8">{row.pickup}</td>
                      <td className="px-6 py-3.5 sm:px-8">
                        <AdminStatusPill value={row.status} />
                      </td>
                      <td className="px-6 py-3.5 text-right tabular-nums text-soft sm:px-8">{formatInr(row.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AdminCardContent>
        </AdminCard>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div
          variants={sectionReveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.12 }}
        >
          <AdminCard>
            <AdminCardContent className="space-y-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">Fleet</p>
                  <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-soft sm:text-2xl">Status overview</h2>
                </div>
                <CarFront className="h-5 w-5 text-electric/80" aria-hidden />
              </div>
              <div className="space-y-4">
                {dashboardFleetStatus.map((row, i) => (
                  <motion.div
                    key={row.label}
                    initial={{ opacity: 0, x: -8 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05, duration: 0.4, ease }}
                    className="space-y-2"
                  >
                    <div className="flex justify-between text-[12px]">
                      <span className="font-medium text-soft">{row.label}</span>
                      <span className="tabular-nums text-muted">
                        {row.count} · {row.pct}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                      <motion.div
                        className={cn(
                          'h-full rounded-full',
                          row.tone === 'emerald' && 'bg-gradient-to-r from-emerald/80 to-emerald',
                          row.tone === 'electric' && 'bg-gradient-to-r from-electric/90 to-electric',
                          row.tone === 'amber' && 'bg-gradient-to-r from-amber-400/90 to-amber-300/80',
                          row.tone === 'muted' && 'bg-white/[0.18]',
                        )}
                        initial={{ width: 0 }}
                        whileInView={{ width: `${row.pct}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.75, delay: 0.1 + i * 0.06, ease }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
              <Link
                href="/admin/fleet"
                className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-electric transition-colors hover:text-electric/85"
              >
                Open fleet <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </AdminCardContent>
          </AdminCard>
        </motion.div>

        <motion.div
          variants={sectionReveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.12 }}
        >
          <AdminCard>
            <AdminCardContent className="space-y-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">Live</p>
                  <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-soft sm:text-2xl">Activity feed</h2>
                </div>
                <Radio className="h-5 w-5 text-electric/80" aria-hidden />
              </div>
              <ul className="space-y-0 divide-y divide-white/[0.06]">
                {dashboardActivityFeed.map((item, i) => (
                  <motion.li
                    key={item.id}
                    initial={{ opacity: 0, y: 6 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.04, duration: 0.35, ease }}
                    className="flex gap-4 py-4 first:pt-0"
                  >
                    <span className="w-14 shrink-0 pt-0.5 text-[11px] font-medium tabular-nums text-muted">{item.time}</span>
                    <div className="min-w-0">
                      <p className="font-medium text-soft">{item.title}</p>
                      <p className="mt-0.5 text-sm text-muted">{item.detail}</p>
                    </div>
                  </motion.li>
                ))}
              </ul>
            </AdminCardContent>
          </AdminCard>
        </motion.div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div
          variants={sectionReveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.12 }}
        >
          <AdminCard>
            <AdminCardContent className="space-y-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">Logistics</p>
                  <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-soft sm:text-2xl">Upcoming pickups</h2>
                </div>
                <CalendarClock className="h-5 w-5 text-electric/80" aria-hidden />
              </div>
              <ul className="space-y-3">
                {dashboardUpcomingPickups.map((p, i) => (
                  <motion.li
                    key={p.id}
                    initial={{ opacity: 0, x: -6 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05, duration: 0.4, ease }}
                  >
                    <Link
                      href="/admin/bookings"
                      className="flex flex-col gap-1 rounded-2xl border border-transparent bg-white/[0.02] px-4 py-3 transition-[border-color,background-color] duration-300 hover:border-white/[0.08] hover:bg-white/[0.05]"
                    >
                      <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-electric/90">{p.when}</span>
                      <span className="text-sm font-medium text-soft">{p.guest}</span>
                      <span className="text-xs text-muted">
                        {p.vehicle} · {p.hub}
                      </span>
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </AdminCardContent>
          </AdminCard>
        </motion.div>

        <motion.div
          variants={sectionReveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.12 }}
        >
          <AdminCard>
            <AdminCardContent className="space-y-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">Inventory</p>
                  <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-soft sm:text-2xl">Availability by class</h2>
                </div>
                <Layers className="h-5 w-5 text-electric/80" aria-hidden />
              </div>
              <div className="space-y-5">
                {dashboardVehicleAvailability.map((v, i) => {
                  const pct = Math.round((v.available / v.total) * 100)
                  return (
                    <motion.div
                      key={v.category}
                      initial={{ opacity: 0, y: 8 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.06, duration: 0.4, ease }}
                      className="space-y-2"
                    >
                      <div className="flex justify-between text-[12px]">
                        <span className="font-medium text-soft">{v.category}</span>
                        <span className="tabular-nums text-muted">
                          {v.available}/{v.total} free
                        </span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-white/[0.06]">
                        <motion.div
                          className="h-full rounded-full bg-gradient-to-r from-sky-400/90 via-electric to-electric/70"
                          initial={{ width: 0 }}
                          whileInView={{ width: `${pct}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.85, delay: 0.08 + i * 0.06, ease }}
                        />
                      </div>
                    </motion.div>
                  )
                })}
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <Button variant="secondary" size="sm" to="/admin/fleet">
                  Fleet map
                </Button>
                <Button variant="secondary" size="sm" to="/admin/analytics">
                  Utilization
                </Button>
              </div>
            </AdminCardContent>
          </AdminCard>
        </motion.div>
      </div>

      <motion.div
        className="flex flex-wrap gap-3"
        variants={sectionReveal}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <Button to="/admin/fleet?add=1">Add vehicle</Button>
        <Button variant="secondary" to="/admin/bookings">
          Review bookings
        </Button>
        <Button variant="secondary" to="/admin/bookings?status=pending_payment">
          Pending payments
        </Button>
        <Button variant="secondary" to="/admin/customers">
          Customers
        </Button>
        <Button variant="secondary" to="/admin/kyc">
          KYC queue
        </Button>
      </motion.div>

      <motion.p
        className="flex items-center justify-center gap-2 pb-2 text-center text-[11px] text-muted"
        variants={sectionReveal}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <Sparkles className="h-3.5 w-3.5 text-electric/70" aria-hidden />
        Sample analytics · connect data sources when ready
      </motion.p>
    </motion.div>
  )
}
