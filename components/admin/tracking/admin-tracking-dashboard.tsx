'use client'

import Link from 'next/link'
import { MapPin, Radio, Fuel } from 'lucide-react'

import { AdminCard, AdminCardContent } from '@/components/admin/admin-card'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { AdminStatusPill } from '@/components/admin/admin-status-pill'
import type { VehicleComplianceAlert, VehicleTrackingRow } from '@/lib/admin/data/tracking'
import { cn } from '@/lib/utils/cn'

export function AdminTrackingDashboard({
  vehicles,
  alerts,
}: {
  vehicles: VehicleTrackingRow[]
  alerts: VehicleComplianceAlert[]
}) {
  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Fleet telemetry"
        title="Vehicle tracking"
        description="GPS connectivity, fuel levels, live trip assignment, and compliance expiry alerts across the Oxour Go fleet."
      />

      {alerts.length > 0 ? (
        <AdminCard className="border-amber-400/20">
          <AdminCardContent className="space-y-3 p-5 sm:p-6">
            <h2 className="text-sm font-semibold text-amber-200">Compliance alerts (30 days)</h2>
            <ul className="space-y-2">
              {alerts.map((a) => (
                <li key={`${a.vehicleId}-${a.alertType}`} className="flex flex-wrap justify-between gap-2 text-sm">
                  <Link href={`/admin/fleet/${a.vehicleId}`} className="font-medium text-soft hover:underline">
                    {a.name}
                    {a.registration ? ` · ${a.registration}` : ''}
                  </Link>
                  <span className="text-muted">
                    {a.alertType.toUpperCase()} expires {a.earliestExpiry}
                  </span>
                </li>
              ))}
            </ul>
          </AdminCardContent>
        </AdminCard>
      ) : null}

      <AdminCard>
        <AdminCardContent className="p-0">
          <div className="scroll-touch overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] text-xs text-muted">
                  <th className="px-4 py-3 font-medium">Vehicle</th>
                  <th className="px-4 py-3 font-medium">Location</th>
                  <th className="px-4 py-3 font-medium">GPS</th>
                  <th className="px-4 py-3 font-medium">Fuel</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Trip</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-muted">
                      No vehicles in catalog. Add fleet units to enable tracking.
                    </td>
                  </tr>
                ) : (
                  vehicles.map((v) => (
                    <tr key={v.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                      <td className="px-4 py-3">
                        <Link href={v.href} className="font-medium text-soft hover:underline">
                          {v.name}
                        </Link>
                        <p className="text-[10px] text-muted">{v.registration ?? v.brand}</p>
                      </td>
                      <td className="px-4 py-3 text-muted">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" aria-hidden />
                          {v.location ?? '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                            v.gpsStatus === 'online'
                              ? 'bg-emerald-500/15 text-emerald-200'
                              : v.gpsStatus === 'offline'
                                ? 'bg-rose-500/15 text-rose-200'
                                : 'bg-white/[0.06] text-muted',
                          )}
                        >
                          <Radio className="h-3 w-3" aria-hidden />
                          {v.gpsStatus}
                        </span>
                        {v.gpsTrackerId ? (
                          <p className="mt-0.5 text-[10px] text-muted">{v.gpsTrackerId}</p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {v.fuelLevelPct != null ? (
                          <span className="inline-flex items-center gap-1 tabular-nums">
                            <Fuel className="h-3.5 w-3.5" aria-hidden />
                            {v.fuelLevelPct}%
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <AdminStatusPill value={v.availabilityStatus} />
                      </td>
                      <td className="px-4 py-3 text-xs text-muted">{v.onTrip ? 'On trip' : 'Idle'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </AdminCardContent>
      </AdminCard>
    </div>
  )
}
