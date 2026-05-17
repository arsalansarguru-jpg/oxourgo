'use client'

import Link from 'next/link'
import {
  ArrowUpRight,
  CarFront,
  ClipboardList,
  CreditCard,
  IndianRupee,
  Shield,
  Users,
} from 'lucide-react'

import { AdminCard, AdminCardContent } from '@/components/admin/admin-card'
import { AdminStatusPill } from '@/components/admin/admin-status-pill'
import { Button } from '@/components/ui/Button'
import type { OpsDashboardBundle } from '@/lib/admin/data/ops-dashboard'
import { formatInr } from '@/lib/format'
import { cn } from '@/lib/utils/cn'

function PanelHeader({
  title,
  description,
  href,
  action,
}: {
  title: string
  description?: string
  href?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-stroke pb-4">
      <div>
        <h2 className="font-display text-base font-semibold text-soft">{title}</h2>
        {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
      </div>
      <div className="flex items-center gap-2">
        {action}
        {href ? (
          <Link href={href} className="inline-flex items-center gap-1 text-sm font-medium text-electric hover:underline">
            View all
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        ) : null}
      </div>
    </div>
  )
}

function KpiCard({
  label,
  value,
  sub,
  href,
  highlight,
}: {
  label: string
  value: string | number
  sub?: string
  href: string
  highlight?: 'warn' | 'critical'
}) {
  return (
    <Link
      href={href}
      className={cn(
        'block rounded-lg border border-stroke bg-carbon p-4 shadow-[var(--shadow-card)] transition-colors hover:border-stroke-strong hover:shadow-[var(--shadow-card-hover)]',
        highlight === 'warn' && 'border-amber-200 bg-amber-50/40 theme-dark:border-amber-500/30 theme-dark:bg-amber-500/10',
        highlight === 'critical' && 'border-red-200 bg-red-50/40 theme-dark:border-red-500/30 theme-dark:bg-red-500/10',
      )}
    >
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold tabular-nums tracking-tight text-soft">{value}</p>
      {sub ? <p className="mt-1 text-xs text-muted">{sub}</p> : null}
    </Link>
  )
}

function DenseTable({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('scroll-touch -mx-1 overflow-x-auto', className)}>
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">{children}</table>
    </div>
  )
}

function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <th className={cn('admin-table-head px-3 py-2.5 font-medium first:pl-1 last:pr-1', className)}>{children}</th>
  )
}

function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={cn('admin-table-row px-3 py-2.5 align-middle first:pl-1 last:pr-1', className)}>{children}</td>
}

export function OpsCommandCenter({ data }: { data: OpsDashboardBundle }) {
  const { visibility, kpis, liveOperations, payments, paymentsSummary, customers, vehicles, pendingActions, loadedAt } =
    data

  const refreshed = new Date(loadedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-semibold text-soft sm:text-2xl">Operations dashboard</h1>
          <p className="mt-1 text-sm text-muted">
            Business command center · Updated {refreshed}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" to="/admin/bookings">
            Bookings
          </Button>
          <Button size="sm" variant="secondary" to="/admin/operations">
            Manual ops
          </Button>
          {visibility.finance ? (
            <Button size="sm" variant="secondary" to="/admin/payments">
              Payments
            </Button>
          ) : null}
        </div>
      </div>

      {/* KPI row */}
      <section aria-label="Key metrics">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-8">
          <KpiCard label="Total bookings" value={kpis.totalBookings} href="/admin/bookings" />
          <KpiCard label="Active rentals" value={kpis.activeRentals} href="/admin/bookings?status=active" />
          <KpiCard
            label="Pending payments"
            value={kpis.pendingPayments}
            sub={formatInr(kpis.pendingPaymentsRupees)}
            href="/admin/payments"
            highlight={kpis.pendingPayments > 0 ? 'warn' : undefined}
          />
          <KpiCard
            label="Monthly revenue"
            value={formatInr(kpis.monthlyRevenue)}
            href="/admin/analytics"
            sub="Posted payments · MTD"
          />
          <KpiCard label="Cars available" value={kpis.carsAvailable} href="/admin/fleet" />
          <KpiCard label="Cars booked" value={kpis.carsBooked} href="/admin/fleet" sub="On trip today" />
          <KpiCard
            label="Pending KYC"
            value={kpis.pendingKyc}
            href="/admin/kyc"
            highlight={kpis.pendingKyc > 0 ? 'warn' : undefined}
          />
          <KpiCard
            label="Refunds pending"
            value={kpis.refundsPending}
            sub={formatInr(kpis.refundsPendingRupees)}
            href="/admin/financials"
            highlight={kpis.refundsPending > 0 ? 'warn' : undefined}
          />
        </div>
      </section>

      {/* Live operations */}
      <AdminCard>
        <AdminCardContent className="space-y-4 p-5 sm:p-6">
          <PanelHeader
            title="Live operations"
            description="Active and upcoming rentals — payment and deposit status at a glance."
            href="/admin/bookings"
          />
          {liveOperations.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">No active or pending bookings in the queue.</p>
          ) : (
            <DenseTable>
              <thead>
                <tr>
                  <Th>Customer</Th>
                  <Th>Car</Th>
                  <Th>Pickup</Th>
                  <Th>Return</Th>
                  <Th>Payment</Th>
                  <Th>Booking</Th>
                  <Th>Deposit</Th>
                  <Th className="w-10"><span className="sr-only">Actions</span></Th>
                </tr>
              </thead>
              <tbody>
                {liveOperations.map((row) => (
                  <tr key={row.id}>
                    <Td className="font-medium text-soft">{row.customerName}</Td>
                    <Td className="text-muted">{row.carLabel}</Td>
                    <Td className="whitespace-nowrap text-xs text-muted">{row.pickupLabel}</Td>
                    <Td className="whitespace-nowrap text-xs text-muted">{row.returnLabel}</Td>
                    <Td>
                      <AdminStatusPill value={row.paymentStatus} />
                    </Td>
                    <Td>
                      <AdminStatusPill value={row.bookingStatus} />
                    </Td>
                    <Td>
                      <AdminStatusPill value={row.depositStatus} />
                    </Td>
                    <Td>
                      <Link href={row.href} className="text-electric hover:underline">
                        Open
                      </Link>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </DenseTable>
          )}
        </AdminCardContent>
      </AdminCard>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Payments */}
        {visibility.finance ? (
          <AdminCard className="xl:col-span-1">
            <AdminCardContent className="space-y-4 p-5 sm:p-6">
              <PanelHeader
                title="Payments"
                description="Outstanding balances, deposits, and refunds."
                href="/admin/payments"
                action={
                  <div className="text-right text-xs text-muted">
                    <p>
                      Pending: <span className="font-semibold text-soft">{formatInr(paymentsSummary.pendingTotalRupees)}</span>
                    </p>
                    <p>
                      Collected: <span className="font-semibold text-soft">{formatInr(paymentsSummary.collectedTotalRupees)}</span>
                    </p>
                  </div>
                }
              />
              {payments.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted">No open payment balances.</p>
              ) : (
                <DenseTable>
                  <thead>
                    <tr>
                      <Th>Customer</Th>
                      <Th>Paid / Due</Th>
                      <Th>Method</Th>
                      <Th>Status</Th>
                      <Th>Deposit</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((row) => (
                      <tr key={row.bookingId}>
                        <Td>
                          <Link href={row.href} className="font-medium text-soft hover:underline">
                            {row.customerName}
                          </Link>
                        </Td>
                        <Td className="tabular-nums text-xs">
                          <span className="text-soft">{formatInr(row.amountPaid)}</span>
                          <span className="text-muted"> / </span>
                          <span className="text-muted">{formatInr(row.amountDue)} due</span>
                        </Td>
                        <Td className="text-xs text-muted">{row.paymentMethod?.replace(/_/g, ' ') ?? '—'}</Td>
                        <Td>
                          <AdminStatusPill value={row.paymentStatus} />
                        </Td>
                        <Td>
                          <AdminStatusPill value={row.depositStatus} />
                          {row.refundAmount != null && row.refundAmount > 0 ? (
                            <p className="mt-0.5 text-[10px] text-muted">Refund {formatInr(row.refundAmount)}</p>
                          ) : null}
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </DenseTable>
              )}
            </AdminCardContent>
          </AdminCard>
        ) : null}

        {/* Pending actions */}
        <AdminCard className={visibility.finance ? 'xl:col-span-1' : 'xl:col-span-2'}>
          <AdminCardContent className="space-y-4 p-5 sm:p-6">
            <PanelHeader title="Pending actions" description="Items requiring staff attention today." />
            <ul className="divide-y divide-stroke">
              {pendingActions.map((action) => (
                <li key={action.id}>
                  <Link
                    href={action.href}
                    className="flex items-center gap-4 py-3 transition-colors hover:bg-fill-glass"
                  >
                    <span
                      className={cn(
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-md border text-xs font-semibold tabular-nums',
                        action.priority === 'high'
                          ? 'border-red-200 bg-red-50 text-red-700 theme-dark:border-red-500/30 theme-dark:bg-red-500/15 theme-dark:text-red-200'
                          : action.priority === 'medium'
                            ? 'border-amber-200 bg-amber-50 text-amber-800 theme-dark:border-amber-500/30 theme-dark:bg-amber-500/15 theme-dark:text-amber-200'
                            : 'border-stroke bg-carbon-deep text-muted',
                      )}
                    >
                      {action.count}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-soft">{action.title}</p>
                      <p className="text-xs text-muted">{action.detail}</p>
                    </div>
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-muted" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </AdminCardContent>
        </AdminCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Customers */}
        <AdminCard>
          <AdminCardContent className="space-y-4 p-5 sm:p-6">
            <PanelHeader
              title="Customer management"
              description="Contact details, KYC, booking history, and outstanding dues."
              href="/admin/customers"
            />
            {customers.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted">No customer profiles loaded.</p>
            ) : (
              <DenseTable>
                <thead>
                  <tr>
                    <Th>Name</Th>
                    <Th>Phone</Th>
                    <Th>Email</Th>
                    <Th>KYC</Th>
                    <Th>Bookings</Th>
                    <Th>Dues</Th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((row) => (
                    <tr key={row.userId}>
                      <Td>
                        <Link href={row.href} className="font-medium text-soft hover:underline">
                          {row.name}
                        </Link>
                        {row.notesPreview ? (
                          <p className="mt-0.5 max-w-[12rem] truncate text-[10px] text-muted" title={row.notesPreview}>
                            {row.notesPreview}
                          </p>
                        ) : null}
                      </Td>
                      <Td className="text-xs text-muted">
                        {row.phone ? (
                          <a href={`https://wa.me/${row.phone.replace(/\D/g, '')}`} className="hover:text-soft" target="_blank" rel="noopener noreferrer">
                            {row.phone}
                          </a>
                        ) : (
                          '—'
                        )}
                      </Td>
                      <Td className="max-w-[8rem] truncate text-xs text-muted">{row.email ?? '—'}</Td>
                      <Td>
                        <AdminStatusPill value={row.kycStatus} />
                      </Td>
                      <Td className="tabular-nums text-muted">{row.bookingCount}</Td>
                      <Td className={cn('tabular-nums', row.outstandingDues > 0 && 'font-medium text-amber-700 theme-dark:text-amber-200')}>
                        {row.outstandingDues > 0 ? formatInr(row.outstandingDues) : '—'}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </DenseTable>
            )}
          </AdminCardContent>
        </AdminCard>

        {/* Vehicles */}
        {visibility.fleet ? (
          <AdminCard>
            <AdminCardContent className="space-y-4 p-5 sm:p-6">
              <PanelHeader
                title="Vehicle management"
                description="Availability, trips, utilization, and maintenance."
                href="/admin/fleet"
              />
              {vehicles.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted">No vehicles in catalog.</p>
              ) : (
                <DenseTable>
                  <thead>
                    <tr>
                      <Th>Vehicle</Th>
                      <Th>Status</Th>
                      <Th>Trip</Th>
                      <Th>Next booking</Th>
                      <Th>Revenue</Th>
                      <Th>Util.</Th>
                      <Th>Maintenance</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {vehicles.map((row) => (
                      <tr key={row.id}>
                        <Td>
                          <Link href={row.href} className="font-medium text-soft hover:underline">
                            {row.name}
                          </Link>
                          {row.registration ? (
                            <p className="text-[10px] text-muted">{row.registration}</p>
                          ) : null}
                        </Td>
                        <Td>
                          <AdminStatusPill value={row.availabilityStatus} />
                        </Td>
                        <Td className="text-xs text-muted">{row.tripStatus}</Td>
                        <Td className="text-xs text-muted">{row.nextBookingLabel ?? '—'}</Td>
                        <Td className="tabular-nums text-xs text-muted">{formatInr(row.revenueRupees)}</Td>
                        <Td className="tabular-nums text-xs text-muted">{row.utilizationPct}%</Td>
                        <Td className="text-xs text-muted">{row.maintenanceStatus}</Td>
                      </tr>
                    ))}
                  </tbody>
                </DenseTable>
              )}
            </AdminCardContent>
          </AdminCard>
        ) : (
          <AdminCard>
            <AdminCardContent className="p-6">
              <PanelHeader title="Vehicle management" description="Fleet access restricted for your role." />
            </AdminCardContent>
          </AdminCard>
        )}
      </div>

      <div className="flex flex-wrap gap-2 border-t border-stroke pt-6">
        <Button variant="secondary" size="sm" to="/admin/bookings">
          <ClipboardList className="h-4 w-4" aria-hidden />
          All bookings
        </Button>
        <Button variant="secondary" size="sm" to="/admin/kyc">
          <Shield className="h-4 w-4" aria-hidden />
          KYC queue
        </Button>
        <Button variant="secondary" size="sm" to="/admin/fleet">
          <CarFront className="h-4 w-4" aria-hidden />
          Fleet
        </Button>
        <Button variant="secondary" size="sm" to="/admin/customers">
          <Users className="h-4 w-4" aria-hidden />
          Customers
        </Button>
        {visibility.finance ? (
          <Button variant="secondary" size="sm" to="/admin/financials">
            <IndianRupee className="h-4 w-4" aria-hidden />
            Financials
          </Button>
        ) : null}
        <Button variant="secondary" size="sm" to="/admin/analytics">
          <CreditCard className="h-4 w-4" aria-hidden />
          Analytics
        </Button>
      </div>
    </div>
  )
}
