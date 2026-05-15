'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Trash2 } from 'lucide-react'

import { adminDeleteVehicleAction } from '@/lib/admin/actions/vehicle-actions'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils/cn'

type Props = {
  vehicleId: string
  label: string
  onDeleted: () => void
}

export function FleetVehicleDeletePanel({ vehicleId, label, onDeleted }: Props) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)

  return (
    <div
      className={cn(
        'rounded-2xl border border-red-500/25 bg-red-500/[0.06] p-4 theme-light:border-red-600/30 theme-light:bg-red-500/8',
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-red-200 theme-light:text-red-900">Archive</p>
      <p className="mt-2 text-sm text-muted">
        Archive <span className="font-medium text-soft">{label}</span> from the live catalog. The record stays in the
        database and can be restored from Backup &amp; recovery.
      </p>
      {error ? <p className="mt-2 text-xs text-red-300 theme-light:text-red-800">{error}</p> : null}
      <Button
        type="button"
        variant="danger"
        size="sm"
        className="mt-4 gap-2"
        disabled={pending}
        onClick={() => {
          if (!window.confirm(`Archive this vehicle? It will be hidden from fleet lists but can be restored later.`)) return
          setError(null)
          start(async () => {
            const r = await adminDeleteVehicleAction(vehicleId)
            if (!r.ok) {
              setError(r.message)
              console.error('[FleetVehicleDeletePanel]', r.message)
              return
            }
            onDeleted()
            router.refresh()
          })
        }}
      >
        <Trash2 className="h-4 w-4" aria-hidden />
        {pending ? 'Archiving…' : 'Archive vehicle'}
      </Button>
    </div>
  )
}
