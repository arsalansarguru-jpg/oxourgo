import type { Car, CarCategory, CarStatus, FuelType, Transmission } from '@/types/car'
import { VEHICLE_IMAGE_FALLBACK } from '@/constants/vehicle-media'
import type { FleetCar, FleetCarAvailabilityLabel, FleetCarCategory, FleetCarFuel } from '@/lib/fleet/types'
import { modelFromListingName, parseMoneyIntRupees } from '@/lib/fleet/vehicle-mappers'
import { getPublicStorageObjectUrl } from '@/lib/supabase/storage-public-url'

export type FleetCarRow = {
  id: string
  brand: string
  model: string
  year: number
  registration_number: string
  fuel_type: string
  transmission: string
  seats: number
  pricing_per_day: number
  security_deposit: number
  availability_status: string
  featured: boolean
  created_at: string
  cover_image_path?: string | null
  gallery_paths?: string[] | null
}

function resolveRowPrimaryImage(row: FleetCarRow): string {
  const path = row.cover_image_path?.trim()
  if (path) {
    const url = getPublicStorageObjectUrl('fleet', path)
    if (url) return url
  }
  return VEHICLE_IMAGE_FALLBACK
}

function resolveRowGallery(row: FleetCarRow, primary: string): string[] {
  const paths = row.gallery_paths?.filter(Boolean) ?? []
  const fromStorage = paths
    .map((p) => getPublicStorageObjectUrl('fleet', p))
    .filter((u): u is string => Boolean(u))
  if (fromStorage.length > 0) return [...fromStorage, primary].slice(0, 6)
  return [primary, primary, primary]
}

function toAvailability(status: string): FleetCarAvailabilityLabel {
  return status?.trim().toLowerCase() === 'available' ? 'Available' : 'Unavailable'
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

function toCarStatus(status: string): CarStatus {
  return status?.trim().toLowerCase() === 'available' ? 'Available' : 'Unavailable'
}

export function mapFleetRowToFleetCar(row: FleetCarRow): FleetCar {
  const price = parseMoneyIntRupees(row.pricing_per_day)
  const imageUrl = resolveRowPrimaryImage(row)
  const model = modelFromListingName(row.brand, row.model)
  const displayName = `${row.brand} ${model}`.trim()
  return {
    id: row.id,
    brand: row.brand,
    model,
    displayName,
    year: row.year,
    registrationNumber: row.registration_number,
    fuel: toFleetFuel(row.fuel_type),
    transmission: toTransmission(row.transmission),
    seats: row.seats,
    pricePerDay: price,
    securityDeposit: parseMoneyIntRupees(row.security_deposit),
    availability: toAvailability(row.availability_status),
    featured: Boolean(row.featured),
    category: toFleetCategory(price),
    imageUrl,
  }
}

export function mapFleetRowToCar(row: FleetCarRow): Car {
  const price = parseMoneyIntRupees(row.pricing_per_day)
  const imageUrl = resolveRowPrimaryImage(row)
  const gallery = resolveRowGallery(row, imageUrl)
  const model = modelFromListingName(row.brand, row.model)
  const name = `${row.brand} ${model}`.trim()
  return {
    id: row.id,
    name,
    status: toCarStatus(row.availability_status),
    category: toCarCategory(price),
    rating: 4.8,
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
      Model: row.model,
      Year: String(row.year),
      Registration: row.registration_number,
      Fuel: toFleetFuel(row.fuel_type),
      Transmission: toTransmission(row.transmission) === 'Auto' ? 'Automatic' : 'Manual',
      Seats: String(row.seats),
    },
    securityDeposit: parseMoneyIntRupees(row.security_deposit),
  }
}
