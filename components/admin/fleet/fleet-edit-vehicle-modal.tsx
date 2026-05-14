'use client'

import Link from 'next/link'

import { FleetVehicleCatalogEditForm } from '@/components/admin/fleet/fleet-vehicle-catalog-edit-form'
import { FleetVehicleDeletePanel } from '@/components/admin/fleet/fleet-vehicle-delete-panel'
import { Modal } from '@/components/ui/Modal'
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
      title={vehicle ? `Edit · ${vehicle.brand} ${vehicle.name}` : undefined}
      className="max-w-3xl"
    >
      {vehicle ? (
        <div className="max-h-[min(78vh,760px)] overflow-y-auto pr-0.5 [-ms-overflow-style:none] [scrollbar-width:thin]">
          <div className="space-y-6">
            <FleetVehicleCatalogEditForm vehicle={vehicle} shell="none" onSaved={onClose} />
            <FleetVehicleDeletePanel
              vehicleId={vehicle.id}
              label={`${vehicle.brand} ${vehicle.name}`.trim()}
              onDeleted={onClose}
            />
            <p className="text-center text-xs text-muted">
              Audit trail & legacy tools:{' '}
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
