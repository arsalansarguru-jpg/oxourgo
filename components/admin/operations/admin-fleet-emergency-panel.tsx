'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { CarFront } from 'lucide-react'

import { AdminCard, AdminCardContent } from '@/components/admin/admin-card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { adminSetVehicleFleetModeAction } from '@/lib/admin/actions/manual-ops-actions'
import type { AdminVehicleRow } from '@/lib/admin/data/fleet'

const FLEET_MODE_OPTS = [
  { value: 'available', label: 'Available' },
  { value: 'unavailable', label: 'Unavailable' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'service', label: 'Service mode' },
  { value: 'accident_hold', label: 'Accident hold' },
] as const

type Props = {
  vehicles: AdminVehicleRow[]
}

export function AdminFleetEmergencyPanel({ vehicles }: Props) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [msg, setMsg] = useState<string | null>(null)

  return (
    <AdminCard>
      <AdminCardContent className="space-y-4">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.1] bg-white/[0.04]">
              <CarFront className="h-5 w-5 text-soft" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-soft">Fleet emergency controls</h2>
              <p className="text-xs text-muted">Mark vehicles offline for maintenance, service, or accident hold.</p>
            </div>
          </div>

          <form
            className="grid gap-3 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault()
              setMsg(null)
              const fd = new FormData(e.currentTarget)
              start(async () => {
                const r = await adminSetVehicleFleetModeAction({
                  vehicleId: String(fd.get('vehicleId') ?? ''),
                  mode: String(fd.get('mode') ?? ''),
                  opsNote: String(fd.get('opsNote') ?? '').trim() || null,
                })
                if (!r.ok) setMsg(r.message ?? 'Update failed.')
                else router.refresh()
              })
            }}
          >
            <Select name="vehicleId" label="Vehicle" required defaultValue="">
              <option value="" disabled>
                Select vehicle
              </option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name || v.brand} · {v.availability_status ?? (v.available ? 'available' : 'offline')}
                </option>
              ))}
            </Select>
            <Select name="mode" label="Mode" required defaultValue="unavailable">
              {FLEET_MODE_OPTS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
            <Input name="opsNote" label="Ops note" className="sm:col-span-2" placeholder="Reason for fleet action" />
            <div className="sm:col-span-2">
              <Button type="submit" variant="secondary" disabled={pending}>
                {pending ? 'Updating…' : 'Apply fleet mode'}
              </Button>
            </div>
          </form>
          {msg ? <p className="text-sm text-red-300">{msg}</p> : null}
        </div>
      </AdminCardContent>
    </AdminCard>
  )
}
