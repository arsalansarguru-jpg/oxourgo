import type { AdminBookingListItem } from '@/lib/admin/data/bookings'
import { fleetCatalogTitle } from '@/lib/admin/fleet-display'

export type BookingVehicleSlice = {
  name: string | null
  brand: string | null
  registration_number: string | null
  image: string | null
  transmission: string | null
  fuel_type: string | null
  year: number | null
  seats: number | null
}

export function firstBookingVehicle(row: AdminBookingListItem): BookingVehicleSlice | null {
  const v = row.vehicles
  if (!v) return null
  const first = Array.isArray(v) ? v[0] : v
  return first ?? null
}

export function bookingVehicleTitle(row: AdminBookingListItem): string {
  const v = firstBookingVehicle(row)
  if (!v) return 'Vehicle'
  return fleetCatalogTitle({
    id: row.vehicle_id ?? 'vehicle',
    name: v.name,
    brand: v.brand,
    registration_number: v.registration_number,
  })
}

export function formatShortBookingId(id: string): string {
  return id.replace(/-/g, '').slice(0, 8).toUpperCase()
}
