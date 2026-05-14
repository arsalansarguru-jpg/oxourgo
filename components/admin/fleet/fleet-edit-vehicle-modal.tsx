'use client'

import Link from 'next/link'

import { Modal } from '@/components/ui/Modal'
import { FleetVehicleCatalogEditForm } from '@/components/admin/fleet/fleet-vehicle-catalog-edit-form'
import type { AdminVehicleRow } from '@/lib/admin/data/fleet'

type Props = {
  vehicle: AdminVehicleRow | null
  onClose: () => void
}

export function FleetEditVehicleModal({ vehicle, onClose }: Props) {
  const open = Boolean(vehicle)
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={vehicle ? `Edit · ${vehicle.name}` : undefined}
      className="max-w-2xl"
    >
      {vehicle ? (
        <div className="max-h-[min(72vh,680px)] overflow-y-auto pr-0.5 [-ms-overflow-style:none] [scrollbar-width:thin]">
          <div className="space-y-6">
            <FleetVehicleCatalogEditForm vehicle={vehicle} shell="none" onSaved={onClose} />
            <p className="text-center text-xs text-muted">
              Need danger-zone tools?{' '}
              <Link href={`/admin/fleet/${vehicle.id}`} className="font-medium text-electric hover:underline">
                Open full workspace
              </Link>
            </p>
          </div>
        </div>
      ) : null}
    </Modal>
  )
}
