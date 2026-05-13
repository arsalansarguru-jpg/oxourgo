import type { Database } from '@/lib/supabase/database.types'
import type { Car, CarCategory, CarStatus, FuelType, Transmission } from '@/types/car'
import type { FleetCar, FleetCarAvailabilityLabel, FleetCarCategory, FleetCarFuel } from '@/lib/fleet/types'
import { getPublicStorageObjectUrl } from '@/lib/supabase/storage-public-url'
import { resolveFleetImageUrl } from '@/lib/fleet/mappers'

export type VehicleRow = Database['public']['Tables']['vehicles']['Row']

/** Parses Postgres numeric / string into a finite rupee integer (≥ 0). */
export function parseMoneyIntRupees(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(0, Math.round(value))
  }
  const s = String(value ?? '')
    .replace(/,/g, '')
    .trim()
  if (!s) return fallback
  const n = Number.parseFloat(s)
  if (!Number.isFinite(n) || n < 0) return fallback
  return Math.round(n)
}

function resolveVehicleImageUrl(image: string | null, brand: string): string {
  const raw = image?.trim()
  if (!raw) return resolveFleetImageUrl(brand)
  if (/^https?:\/\//i.test(raw)) return raw
  const url = getPublicStorageObjectUrl('fleet', raw)
  return url ?? resolveFleetImageUrl(brand)
}

function modelFromListingName(brand: string, name: string): string {
  const b = brand.trim()
  const n = name.trim()
  if (!n) return 'Model'
  if (b && n.toLowerCase().startsWith(b.toLowerCase())) {
    const rest = n.slice(b.length).trim()
    return rest || n
  }
  return n
}

/**
 * Bookable when `vehicles.available === true`.
 * If the boolean column is missing (older rows), falls back to `availability_status === 'available'`.
 */
export function isVehicleAvailableForBooking(row: {
  available?: boolean | null
  availability_status?: string | null
}): boolean {
  if (typeof row.available === 'boolean') {
    return row.available === true
  }
  return String(row.availability_status ?? '').trim().toLowerCase() === 'available'
}

function toAvailabilityLabel(row: VehicleRow): FleetCarAvailabilityLabel {
  return isVehicleAvailableForBooking(row) ? 'Available' : 'Unavailable'
}

function toFleetFuel(raw: string): FleetCarFuel {
  const map: Record<string, FleetCarFuel> = {
    petrol: 'Petrol',
    diesel: 'Diesel',
    electric: 'Electric',
    hybrid: 'Hybrid',
    cng: 'CNG',
  }
  return map[raw.toLowerCase()] ?? 'Petrol'
}

function toCarFuel(raw: string): FuelType {
  const f = raw.toLowerCase()
  if (f === 'diesel') return 'Diesel'
  if (f === 'electric') return 'Electric'
  if (f === 'hybrid') return 'Hybrid'
  if (f === 'cng') return 'CNG'
  return 'Petrol'
}

function toTransmission(raw: string): Transmission {
  return raw.toLowerCase() === 'manual' ? 'Manual' : 'Auto'
}

function toFleetCategory(pricePerDay: number): FleetCarCategory {
  if (pricePerDay >= 10000) return 'Luxury'
  if (pricePerDay >= 7000) return 'SUV'
  if (pricePerDay >= 4000) return 'Sedan'
  if (pricePerDay <= 3000) return 'Budget'
  return 'Hatchback'
}

function toCarCategory(pricePerDay: number): CarCategory {
  return toFleetCategory(pricePerDay) as CarCategory
}

function toCarStatus(row: VehicleRow): CarStatus {
  return isVehicleAvailableForBooking(row) ? 'Available' : 'Unavailable'
}

export function mapVehicleRowToFleetCar(row: VehicleRow): FleetCar {
  const price = parseMoneyIntRupees(row.price_per_day)
  const imageUrl = resolveVehicleImageUrl(row.image, row.brand)
  const displayName = row.name.trim() || `${row.brand} ${modelFromListingName(row.brand, row.name)}`.trim()
  return {
    id: row.id,
    brand: row.brand,
    model: modelFromListingName(row.brand, row.name),
    displayName,
    year: row.year,
    registrationNumber: row.registration_number || '—',
    fuel: toFleetFuel(row.fuel_type),
    transmission: toTransmission(row.transmission),
    seats: row.seats,
    pricePerDay: price,
    securityDeposit: parseMoneyIntRupees(row.security_deposit),
    availability: toAvailabilityLabel(row),
    featured: Boolean(row.featured),
    category: toFleetCategory(price),
    imageUrl,
  }
}

export function mapVehicleRowToCar(row: VehicleRow): Car {
  const price = parseMoneyIntRupees(row.price_per_day)
  const imageUrl = resolveVehicleImageUrl(row.image, row.brand)
  const name = row.name.trim() || `${row.brand} ${modelFromListingName(row.brand, row.name)}`.trim()
  const gallery = [imageUrl, imageUrl, imageUrl]
  return {
    id: row.id,
    name,
    status: toCarStatus(row),
    category: toCarCategory(price),
    rating: 0,
    reviews: 0,
    fuel: toCarFuel(row.fuel_type),
    transmission: toTransmission(row.transmission),
    seats: row.seats,
    pricePerDay: price,
    imageUrl,
    gallery,
    featured: Boolean(row.featured),
    description: `${name} (${row.year}) — verified Oxour Go fleet vehicle with transparent daily pricing and concierge support across Mumbai.`,
    specs: {
      Brand: row.brand,
      Year: String(row.year),
      Registration: row.registration_number || '—',
      Fuel: toFleetFuel(row.fuel_type),
      Transmission: toTransmission(row.transmission) === 'Auto' ? 'Automatic' : 'Manual',
      Seats: String(row.seats),
    },
    securityDeposit: parseMoneyIntRupees(row.security_deposit),
  }
}
