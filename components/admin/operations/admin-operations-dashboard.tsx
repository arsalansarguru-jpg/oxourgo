'use client'

import Link from 'next/link'
import { Activity, ClipboardList, Crown, PauseCircle, Wrench } from 'lucide-react'

import { AdminFleetEmergencyPanel } from '@/components/admin/operations/admin-fleet-emergency-panel'
import { AdminManualBookingPanel } from '@/components/admin/operations/admin-manual-booking-panel'
import { AdminCard, AdminCardContent } from '@/components/admin/admin-card'
import type { AdminAuditActivityRow } from '@/lib/admin/data/staff-users'
import type { AdminVehicleRow } from '@/lib/admin/data/fleet'
import type { BookingOpsActivityRow, OpsDashboardStats } from '@/lib/admin/data/operations'
import { cn } from '@/lib/utils/cn'

type Props = {
  stats: OpsDashboardStats
  audit: AdminAuditActivityRow[]
  activity: BookingOpsActivityRow[]
  vehicles: AdminVehicleRow[]
  canBypass: boolean
  canWrite: boolean
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone = 'default',
}: {
  label: string
  value: number
  icon: typeof Activity
  tone?: 'default' | 'warn' | 'accent'
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 shadow-[var(--shadow-card)]',
        tone === 'warn' && 'border-amber-400/20 bg-amber-500/[0.04]',
        tone === 'accent' && 'border-electric/20 bg-electric/[0.04]',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">{label}</p>
        <Icon className="h-4 w-4 text-muted/70" />
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums tracking-[-0.03em] text-soft">{value}</p>
    </div>
  )
}

export function AdminOperationsDashboard({
  stats,
  audit,
  activity,
  vehicles,
  canBypass,
  canWrite,
}: Props) {
  return (
    <div className="space-y-8">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="On hold" value={stats.bookingsOnHold} icon={PauseCircle} tone="warn" />
        <StatCard label="Manual bookings" value={stats.manualBookings} icon={ClipboardList} tone="accent" />
        <StatCard label="VIP active" value={stats.vipBookings} icon={Crown} />
        <StatCard label="Maintenance" value={stats.fleetMaintenance} icon={Wrench} />
        <StatCard label="Service mode" value={stats.fleetService} icon={Wrench} />
        <StatCard label="Accident hold" value={stats.fleetAccidentHold} icon={Wrench} tone="warn" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {canWrite ? <AdminManualBookingPanel vehicles={vehicles} canBypass={canBypass} /> : null}
        <AdminFleetEmergencyPanel vehicles={vehicles} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <AdminCard>
          <AdminCardContent className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-soft">Booking activity</h2>
              <Link href="/admin/bookings" className="text-xs text-electric hover:underline">
                All bookings
              </Link>
            </div>
            {activity.length === 0 ? (
              <p className="text-sm text-muted">No recent ops activity.</p>
            ) : (
              <ul className="max-h-80 space-y-2 overflow-y-auto text-xs">
                {activity.map((row) => (
                  <li key={row.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Link href={`/admin/bookings/${row.bookingId}`} className="font-medium text-electric hover:underline">
                        Booking
                      </Link>
                      <span className="text-[10px] text-muted">{new Date(row.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="mt-1 text-muted">{row.summary}</p>
                  </li>
                ))}
              </ul>
            )}
          </AdminCardContent>
        </AdminCard>

        <AdminCard>
          <AdminCardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-muted" />
              <h2 className="text-lg font-semibold text-soft">Admin audit log</h2>
            </div>
            {audit.length === 0 ? (
              <p className="text-sm text-muted">No audit events yet.</p>
            ) : (
              <ul className="max-h-80 space-y-2 overflow-y-auto font-mono text-[11px] text-muted">
                {audit.map((row) => (
                  <li key={row.id} className="rounded-lg border border-white/[0.05] px-2 py-1.5">
                    <span className="text-soft/80">{row.action}</span>
                    <span className="text-muted/60"> · {row.entityType}</span>
                    {row.entityId ? <span className="text-muted/50"> · {row.entityId.slice(0, 8)}…</span> : null}
                    <div className="text-[10px] text-muted/50">{new Date(row.createdAt).toLocaleString()}</div>
                  </li>
                ))}
              </ul>
            )}
          </AdminCardContent>
        </AdminCard>
      </div>
    </div>
  )
}
