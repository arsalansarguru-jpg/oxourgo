'use client'

import { Modal } from '@/components/ui/Modal'
import { FleetVehicleCreateForm } from '@/components/admin/fleet/fleet-vehicle-create-form'

type Props = {
  open: boolean
  onClose: () => void
}

export function FleetAddVehicleModal({ open, onClose }: Props) {
  return (
    <Modal open={open} onClose={onClose} title="Add catalog vehicle" className="max-w-xl">
      <FleetVehicleCreateForm
        embedded
        onCreated={() => {
          onClose()
        }}
      />
    </Modal>
  )
}
