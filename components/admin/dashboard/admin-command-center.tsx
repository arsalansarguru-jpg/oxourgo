'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { LucideIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  ArrowUpRight,
  Banknote,
  CalendarClock,
  CarFront,
  ClipboardList,
  CreditCard,
  FileCheck,
  Gauge,
  IndianRupee,
  Radio,
  RotateCcw,
  Shield,
  Sparkles,
  Wrench,
} from 'lucide-react'

import { AdminAuditTimeline } from '@/components/admin/audit/admin-audit-timeline'
import { AdminCard, AdminCardContent } from '@/components/admin/admin-card'
import { Button } from '@/components/ui/Button'
import type { CommandCenterBundle } from '@/lib/admin/data/command-center'
import { formatInr } from '@/lib/format'
import { cn } from '@/lib/utils/cn'

const ease = [0.22, 1, 0.36, 1] as const

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05, delayChildren: 0.03 } },
}

const staggerItem = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease } },
}

const sectionReveal = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease } },
}

function OpsMetricCard({
  label,
  value,
  href,
  icon: Icon,
  tone = 'default',
}: {
  label: string
  value: string | number
  href: string
  icon: LucideIcon
  tone?: 'default' | 'warn' | 'critical'
}) {
  return (
    <motion.div variants={staggerItem}>
      <Link href={href} className="group block outline-none">
        <AdminCard
          className={cn(
            'relative h-full overflow-hidden p-4 transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-accent)] sm:p-5',
            tone === 'warn' && 'border-amber-400/20',
            tone === 'critical' && 'border-rose-400/25',
          )}
        >
          <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-electric/10 blur-2xl transition-opacity group-hover:opacity-100" />
          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">{label}</p>
              <p className="mt-2 text-2xl font-semibold tabular-nums tracking-[-0.04em] text-soft sm:text-[1.75rem]">
                {value}
              </p>
            </div>
            <div
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.05] text-electric',
                tone === 'warn' && 'text-amber-200',
                tone === 'critical' && 'text-rose-200',
              )}
            >
              <Icon className="h-4.5 w-4.5" aria-hidden />
            </div>
          </div>
          <ArrowUpRight className="relative mt-3 ml-auto h-4 w-4 text-muted opacity-0 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" />
        </AdminCard>
      </Link>
    </motion.div>
  )
}

function FinanceTile({
  label,
  value,
  hint,
  className,
}: {
  label: string
  value: string
  hint?: string
  className?: string
}) {
  return (
    <div className={cn('rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4', className)}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">{label}</p>
      <p className="mt-2 text-xl font-semibold tabular-nums tracking-[-0.03em] text-soft">{value}</p>
      {hint ? <p className="mt-1 text-[11px] text-muted">{hint}</p> : null}
    </div>
  )
}

function QueueRow({
  label,
  count,
  href,
  icon: Icon,
}: {
  label: string
  count: number
  href: string
  icon: LucideIcon
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 rounded-2xl border border-transparent px-4 py-3.5 transition-[border-color,background-color] hover:border-white/[0.08] hover:bg-white/[0.04]"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-electric">
        <Icon className="h-4 w-4" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-soft">{label}</p>
      </div>
      <span
        className={cn(
          'rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums',
          count > 0 ? 'bg-electric/15 text-electric' : 'bg-white/[0.06] text-muted',
        )}
      >
        {count}
      </span>
      <ArrowUpRight className="h-4 w-4 shrink-0 text-muted" />
    </Link>
  )
}

function FleetBar({
  label,
  count,
  total,
  tone,
}: {
  label: string
  count: number
  total: number
  tone: 'emerald' | 'electric' | 'amber' | 'sky' | 'muted'
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-[12px]">
        <span className="font-medium text-soft">{label}</span>
        <span className="tabular-nums text-muted">
          {count} · {pct}%
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
        <motion.div
          className={cn(
            'h-full rounded-full',
            tone === 'emerald' && 'bg-gradient-to-r from-emerald/80 to-emerald',
            tone === 'electric' && 'bg-gradient-to-r from-electric/90 to-electric',
            tone === 'amber' && 'bg-gradient-to-r from-amber-400/90 to-amber-300/80',
            tone === 'sky' && 'bg-gradient-to-r from-sky-400/90 to-sky-300/80',
            tone === 'muted' && 'bg-white/[0.18]',
          )}
          initial={{ width: 0 }}
          whileInView={{ width: `${pct}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease }}
        />
      </div>
    </div>
  )
}

const UPCOMING_KIND_STYLE: Record<string, string> = {
  pickup: 'text-emerald-200',
  return: 'text-sky-200',
  expiring: 'text-amber-200',
  refund: 'text-electric',
}

const ALERT_STYLE = {
  critical: 'border-rose-400/25 bg-rose-500/[0.06]',
  warn: 'border-amber-400/25 bg-amber-500/[0.06]',
  info: 'border-white/[0.08] bg-white/[0.03]',
} as const

export function AdminCommandCenter({ data }: { data: CommandCenterBundle }) {
  const { visibility, live, finance, fleet, queue, auditEntries, actorLookup, upcoming, alerts, loadedAt } =
    data

  const router = useRouter()
  const REFRESH_KEY = 'oxour-admin-pulse-deadline'
  const REFRESH_INTERVAL_SEC = 30

  const [countdown, setCountdown] = useState(REFRESH_INTERVAL_SEC)
  const [refreshed, setRefreshed] = useState<string>('')

  useEffect(() => {
    try {
      setRefreshed(
        new Date(loadedAt).toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
      )
    } catch {
      setRefreshed('')
    }

    const now = Date.now()
    let deadline = now + REFRESH_INTERVAL_SEC * 1000
    try {
      const stored = sessionStorage.getItem(REFRESH_KEY)
      const parsed = stored ? Number(stored) : NaN
      if (Number.isFinite(parsed) && parsed > now) {
        deadline = parsed
      } else {
        sessionStorage.setItem(REFRESH_KEY, String(deadline))
      }
    } catch {
      /* private mode */
    }
    setCountdown(Math.max(1, Math.ceil((deadline - now) / 1000)))
  }, [loadedAt])

  useEffect(() => {
    const timer = setInterval(() => {
      let deadline = Date.now() + REFRESH_INTERVAL_SEC * 1000
      try {
        const stored = sessionStorage.getItem(REFRESH_KEY)
        const parsed = stored ? Number(stored) : NaN
        if (Number.isFinite(parsed)) deadline = parsed
      } catch {
        /* ignore */
      }

      const remaining = Math.ceil((deadline - Date.now()) / 1000)
      if (remaining <= 0) {
        const next = Date.now() + REFRESH_INTERVAL_SEC * 1000
        try {
          sessionStorage.setItem(REFRESH_KEY, String(next))
        } catch {
          /* ignore */
        }
        router.refresh()
        setCountdown(REFRESH_INTERVAL_SEC)
        return
      }
      setCountdown(remaining)
    }, 1000)
    return () => clearInterval(timer)
  }, [router])

  return (
    <motion.div
      className="space-y-8 lg:space-y-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease }}
    >
      <motion.div
        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/[0.06] bg-gradient-to-r from-white/[0.04] to-transparent px-5 py-4"
        variants={sectionReveal}
        initial="hidden"
        animate="visible"
      >
        <div className="flex items-center gap-3">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald/40 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald" />
          </span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-electric/90">Live HQ</p>
            <p className="text-sm text-muted">
              Operational pulse{refreshed ? ` · refreshed ${refreshed}` : ''}
              <span className="text-[11px] font-medium text-electric/70 ml-2">(auto-refreshing in {countdown}s)</span>
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" to="/admin/operations">
            Manual ops
          </Button>
          <Button variant="secondary" size="sm" to="/admin/analytics">
            Analytics
          </Button>
        </div>
      </motion.div>

      {/* Live operations metrics */}
      <section>
        <SectionEyebrow title="Live operations" />
        <motion.div
          className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <OpsMetricCard label="Active trips" value={live.activeTrips} href="/admin/bookings?status=active" icon={CarFront} />
          <OpsMetricCard
            label="Pending bookings"
            value={live.pendingBookings}
            href="/admin/bookings?status=pending_payment"
            icon={ClipboardList}
          />
          <OpsMetricCard
            label="Pending KYC"
            value={live.pendingKyc}
            href="/admin/kyc"
            icon={Shield}
            tone={live.pendingKyc > 0 ? 'warn' : 'default'}
          />
          <OpsMetricCard
            label="Pending payments"
            value={live.pendingPayments}
            href="/admin/payments"
            icon={CreditCard}
            tone={live.pendingPayments > 0 ? 'warn' : 'default'}
          />
          <OpsMetricCard
            label="Overdue returns"
            value={live.overdueReturns}
            href="/admin/bookings?status=active"
            icon={RotateCcw}
            tone={live.overdueReturns > 0 ? 'critical' : 'default'}
          />
          <OpsMetricCard
            label="Available vehicles"
            value={live.availableVehicles}
            href="/admin/fleet"
            icon={Gauge}
          />
        </motion.div>
      </section>

      <div className="grid gap-6 xl:grid-cols-12">
        {/* Financial overview */}
        {visibility.finance && finance ? (
          <motion.div
            className="xl:col-span-5"
            variants={sectionReveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
          >
            <AdminCard className="h-full">
              <AdminCardContent className="space-y-5 p-4 sm:p-6 lg:p-7">
                <SectionHeader
                  eyebrow="Finance"
                  title="Financial overview"
                  icon={IndianRupee}
                  href="/admin/payments"
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <FinanceTile label="Revenue today" value={formatInr(finance.revenueTodayRupees)} hint="Posted charges · UTC day" />
                  <FinanceTile
                    label="Pending collections"
                    value={formatInr(finance.pendingCollectionsRupees)}
                    hint="Open rental balances"
                  />
                  <FinanceTile label="Deposits held" value={formatInr(finance.depositsHeldRupees)} hint="Active holds" />
                  <FinanceTile
                    label="Refunds pending"
                    value={`${finance.refundsPendingCount} · ${formatInr(finance.refundsPendingRupees)}`}
                    hint="Awaiting processing"
                  />
                  <FinanceTile
                    label="Penalties outstanding"
                    value={formatInr(finance.penaltiesOutstandingRupees)}
                    hint="Violations & fines"
                    className="sm:col-span-2"
                  />
                </div>
                <Link
                  href="/admin/financials"
                  className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-electric hover:text-electric/85"
                >
                  Deposits & refunds <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </AdminCardContent>
            </AdminCard>
          </motion.div>
        ) : (
          <motion.div className="xl:col-span-5" variants={sectionReveal} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <AdminCard>
              <AdminCardContent className="p-4 sm:p-6 lg:p-7">
                <SectionHeader eyebrow="Finance" title="Restricted" icon={Banknote} />
                <p className="mt-3 text-sm text-muted">
                  Financial metrics are hidden for your role. Contact an ops admin if you need access.
                </p>
              </AdminCardContent>
            </AdminCard>
          </motion.div>
        )}

        {/* Fleet status */}
        {visibility.fleet && fleet ? (
          <motion.div
            className="xl:col-span-4"
            variants={sectionReveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
          >
            <AdminCard className="h-full">
              <AdminCardContent className="space-y-5 p-4 sm:p-6 lg:p-7">
                <SectionHeader eyebrow="Fleet" title="Fleet status" icon={CarFront} href="/admin/fleet" />
                <div className="space-y-4">
                  <FleetBar label="Available" count={fleet.available} total={fleet.total} tone="emerald" />
                  <FleetBar label="On trip (booked)" count={fleet.booked} total={fleet.total} tone="electric" />
                  <FleetBar label="Maintenance" count={fleet.maintenance} total={fleet.total} tone="amber" />
                  <FleetBar label="Service mode" count={fleet.serviceMode} total={fleet.total} tone="sky" />
                  {fleet.accidentHold > 0 ? (
                    <FleetBar label="Accident hold" count={fleet.accidentHold} total={fleet.total} tone="muted" />
                  ) : null}
                </div>
              </AdminCardContent>
            </AdminCard>
          </motion.div>
        ) : null}

        {/* Operations queue */}
        <motion.div
          className={cn(visibility.fleet && fleet ? 'xl:col-span-3' : 'xl:col-span-7')}
          variants={sectionReveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
        >
          <AdminCard className="h-full">
            <AdminCardContent className="space-y-2 p-4 sm:p-5">
              <SectionHeader eyebrow="Queue" title="Operations queue" icon={ClipboardList} className="px-2 pt-2" />
              <div className="divide-y divide-white/[0.06]">
                <QueueRow
                  label="Bookings needing approval"
                  count={queue.bookingsNeedingApproval}
                  href="/admin/bookings?status=pending_payment"
                  icon={FileCheck}
                />
                {visibility.kyc ? (
                  <QueueRow label="KYC pending review" count={queue.kycPendingReview} href="/admin/kyc" icon={Shield} />
                ) : null}
                {visibility.finance ? (
                  <QueueRow
                    label="Payments pending confirmation"
                    count={queue.paymentsPendingConfirmation}
                    href="/admin/payments"
                    icon={CreditCard}
                  />
                ) : null}
                <QueueRow
                  label="Vehicles needing inspection"
                  count={queue.vehiclesNeedingInspection}
                  href="/admin/bookings"
                  icon={Wrench}
                />
              </div>
            </AdminCardContent>
          </AdminCard>
        </motion.div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Activity feed */}
        <motion.div variants={sectionReveal} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.12 }}>
          <AdminCard>
            <AdminCardContent className="space-y-5 p-4 sm:p-6 lg:p-7">
              <SectionHeader
                eyebrow="Activity"
                title="Live activity feed"
                icon={Radio}
                href={visibility.audit ? '/admin/audit' : undefined}
              />
              {visibility.audit && auditEntries.length > 0 ? (
                <AdminAuditTimeline entries={auditEntries} actorLookup={actorLookup} compact showEntityLinks />
              ) : (
                <p className="rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.02] px-4 py-8 text-center text-sm text-muted">
                  {visibility.audit
                    ? 'No audit events yet — actions across bookings, fleet, and payments will appear here.'
                    : 'Audit log access is restricted for your role.'}
                </p>
              )}
            </AdminCardContent>
          </AdminCard>
        </motion.div>

        {/* Upcoming + Alerts */}
        <div className="space-y-6">
          <motion.div variants={sectionReveal} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.12 }}>
            <AdminCard>
              <AdminCardContent className="space-y-4 p-4 sm:p-6 lg:p-7">
                <SectionHeader eyebrow="Schedule" title="Upcoming actions" icon={CalendarClock} />
                {upcoming.length === 0 ? (
                  <p className="text-sm text-muted">No pickups, returns, or finance actions scheduled for today.</p>
                ) : (
                  <ul className="space-y-2">
                    {upcoming.map((item, i) => (
                      <motion.li
                        key={item.id}
                        initial={{ opacity: 0, x: -6 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.04, duration: 0.35, ease }}
                      >
                        <Link
                          href={item.href}
                          className="flex flex-col gap-0.5 rounded-2xl border border-transparent bg-white/[0.02] px-4 py-3 transition-colors hover:border-white/[0.08] hover:bg-white/[0.05]"
                        >
                          <span
                            className={cn(
                              'text-[10px] font-semibold uppercase tracking-[0.12em]',
                              UPCOMING_KIND_STYLE[item.kind] ?? 'text-muted',
                            )}
                          >
                            {item.whenLabel} · {item.kind}
                          </span>
                          <span className="text-sm font-medium text-soft">{item.label}</span>
                          <span className="text-xs text-muted">{item.sublabel}</span>
                        </Link>
                      </motion.li>
                    ))}
                  </ul>
                )}
              </AdminCardContent>
            </AdminCard>
          </motion.div>

          <motion.div variants={sectionReveal} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.12 }}>
            <AdminCard>
              <AdminCardContent className="space-y-4 p-4 sm:p-6 lg:p-7">
                <SectionHeader eyebrow="Risk" title="Alerts & flags" icon={AlertTriangle} />
                {alerts.length === 0 ? (
                  <p className="flex items-center gap-2 text-sm text-muted">
                    <Sparkles className="h-4 w-4 text-emerald/80" aria-hidden />
                    All clear — no critical flags right now.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {alerts.map((alert) => (
                      <li key={alert.id}>
                        {alert.href ? (
                          <Link
                            href={alert.href}
                            className={cn(
                              'block rounded-2xl border px-4 py-3.5 transition-colors hover:border-white/[0.12]',
                              ALERT_STYLE[alert.severity],
                            )}
                          >
                            <AlertBody alert={alert} />
                          </Link>
                        ) : (
                          <div className={cn('rounded-2xl border px-4 py-3.5', ALERT_STYLE[alert.severity])}>
                            <AlertBody alert={alert} />
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </AdminCardContent>
            </AdminCard>
          </motion.div>
        </div>
      </div>

      <motion.div
        className="flex flex-wrap gap-3"
        variants={sectionReveal}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <Button to="/admin/bookings">Bookings</Button>
        <Button variant="secondary" to="/admin/operations">
          Operations
        </Button>
        {visibility.fleet ? (
          <Button variant="secondary" to="/admin/fleet">
            Fleet
          </Button>
        ) : null}
        {visibility.kyc ? (
          <Button variant="secondary" to="/admin/kyc">
            KYC queue
          </Button>
        ) : null}
        {visibility.finance ? (
          <Button variant="secondary" to="/admin/payments">
            Payments
          </Button>
        ) : null}
      </motion.div>
    </motion.div>
  )
}

function SectionEyebrow({ title }: { title: string }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">{title}</p>
  )
}

function SectionHeader({
  eyebrow,
  title,
  icon: Icon,
  href,
  className,
}: {
  eyebrow: string
  title: string
  icon: LucideIcon
  href?: string
  className?: string
}) {
  const inner = (
    <div className={cn('flex items-start justify-between gap-3', className)}>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">{eyebrow}</p>
        <h2 className="mt-1.5 text-lg font-semibold tracking-[-0.03em] text-soft sm:text-xl">{title}</h2>
      </div>
      <Icon className="h-5 w-5 shrink-0 text-electric/80" aria-hidden />
    </div>
  )
  if (href) {
    return (
      <Link href={href} className="group block">
        {inner}
        <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-electric opacity-0 transition-opacity group-hover:opacity-100">
          View all <ArrowUpRight className="h-3 w-3" />
        </span>
      </Link>
    )
  }
  return inner
}

function AlertBody({ alert }: { alert: CommandCenterBundle['alerts'][number] }) {
  return (
    <>
      <p className="text-sm font-semibold text-soft">{alert.title}</p>
      <p className="mt-1 text-xs leading-relaxed text-muted">{alert.detail}</p>
    </>
  )
}
