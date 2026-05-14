import type { AdminBookingListItem } from '@/lib/admin/data/bookings'

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
  const name = v.name?.trim()
  if (name) return name
  const brand = v.brand?.trim()
  return brand || 'Vehicle'
}

export function formatShortBookingId(id: string): string {
  return id.replace(/-/g, '').slice(0, 8).toUpperCase()
}
