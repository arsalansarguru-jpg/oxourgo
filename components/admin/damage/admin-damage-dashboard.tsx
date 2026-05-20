'use client'

import Link from 'next/link'

import { AdminCard, AdminCardContent } from '@/components/admin/admin-card'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { AdminStatusPill } from '@/components/admin/admin-status-pill'
import type { DamageReportMetrics, DamageReportRow } from '@/lib/admin/data/damage-reports'
import type { AdminViolationMetrics, AdminViolationWithBooking } from '@/lib/admin/data/violations'
import { violationTypeLabel } from '@/lib/booking/violations'
import { formatInr } from '@/lib/format'

export function AdminDamageDashboard({
  metrics,
  reports,
  violationMetrics,
  damageViolations,
}: {
  metrics: DamageReportMetrics
  reports: DamageReportRow[]
  violationMetrics: AdminViolationMetrics
  damageViolations: AdminViolationWithBooking[]
}) {
  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Post-trip"
        title="Damage & penalty management"
        description="Inspection photos, repair tracking, customer liability, and damage-related violations linked to deposits."
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Open claims" value={String(metrics.openClaims)} />
        <Stat label="Under inspection" value={String(metrics.underInspection)} />
        <Stat label="Customer liability" value={formatInr(metrics.totalLiabilityRupees)} />
        <Stat label="Damage violations" value={String(violationMetrics.openViolationsCount)} />
      </div>

      <AdminCard>
        <AdminCardContent className="space-y-4 p-5 sm:p-6">
          <h2 className="font-display text-base font-semibold text-soft">Damage reports</h2>
          {reports.length === 0 ? (
            <p className="text-sm text-muted">No structured damage reports yet. Create from return inspection or booking detail.</p>
          ) : (
            <ul className="divide-y divide-white/[0.06]">
              {reports.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <Link href={r.href} className="font-medium text-soft hover:underline">
                      {r.description.slice(0, 80)}
                    </Link>
                    <p className="text-xs text-muted">{new Date(r.reportedAt).toLocaleString('en-IN')}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <AdminStatusPill value={r.status} />
                    <span className="text-sm tabular-nums text-muted">{formatInr(r.customerLiableRupees)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </AdminCardContent>
      </AdminCard>

      <AdminCard>
        <AdminCardContent className="space-y-4 p-5 sm:p-6">
          <h2 className="font-display text-base font-semibold text-soft">Damage liabilities (violations)</h2>
          {damageViolations.length === 0 ? (
            <p className="text-sm text-muted">No damage liability violations on file.</p>
          ) : (
            <ul className="divide-y divide-white/[0.06]">
              {damageViolations.map((v) => (
                <li key={v.id} className="flex flex-wrap justify-between gap-2 py-3">
                  <Link href={`/admin/bookings/${v.booking_id}`} className="text-sm font-medium text-soft hover:underline">
                    {violationTypeLabel(v.violation_type)} · {v.reason.slice(0, 60)}
                  </Link>
                  <div className="flex items-center gap-2">
                    <AdminStatusPill value={v.status} />
                    <span className="text-sm tabular-nums">{formatInr(v.amount_rupees)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </AdminCardContent>
      </AdminCard>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">{label}</p>
      <p className="mt-2 text-xl font-semibold text-soft">{value}</p>
    </div>
  )
}
