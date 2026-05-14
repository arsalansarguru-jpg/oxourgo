'use client'

import { FleetVehicleCatalogEditForm } from '@/components/admin/fleet/fleet-vehicle-catalog-edit-form'
import type { AdminVehicleRow } from '@/lib/admin/data/fleet'

export function AdminVehicleFieldsForm({ vehicle }: { vehicle: AdminVehicleRow }) {
  return <FleetVehicleCatalogEditForm vehicle={vehicle} shell="card" />
}
