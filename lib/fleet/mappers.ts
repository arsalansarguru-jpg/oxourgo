import type { Car, CarCategory, CarStatus, FuelType, Transmission } from '@/types/car'
import type { FleetCar, FleetCarAvailabilityLabel, FleetCarCategory, FleetCarFuel } from '@/lib/fleet/types'
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

const brandImageMap: Record<string, string> = {
  bmw: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1600&q=80',
  audi: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=1600&q=80',
  mercedes: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=1600&q=80',
  porsche: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1600&q=80',
  range: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1600&q=80',
  land: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1600&q=80',
  toyota: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1600&q=80',
  honda: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=1600&q=80',
  maruti: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1600&q=80',
  hyundai: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1600&q=80',
  kia: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1600&q=80',
}

const fallbackImage =
  'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=1600&q=80'

export function resolveFleetImageUrl(brand: string): string {
  const key = brand.trim().toLowerCase()
  return brandImageMap[key] ?? fallbackImage
}

function resolveRowPrimaryImage(row: FleetCarRow): string {
  const path = row.cover_image_path?.trim()
  if (path) {
    const url = getPublicStorageObjectUrl('fleet', path)
    if (url) return url
  }
  return resolveFleetImageUrl(row.brand)
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
  return status === 'available' ? 'Available' : 'Unavailable'
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
  return status === 'available' ? 'Available' : 'Unavailable'
}

export function mapFleetRowToFleetCar(row: FleetCarRow): FleetCar {
  const price = Number(row.pricing_per_day)
  const imageUrl = resolveRowPrimaryImage(row)
  return {
    id: row.id,
    brand: row.brand,
    model: row.model,
    year: row.year,
    registrationNumber: row.registration_number,
    fuel: toFleetFuel(row.fuel_type),
    transmission: toTransmission(row.transmission),
    seats: row.seats,
    pricePerDay: price,
    securityDeposit: Number(row.security_deposit),
    availability: toAvailability(row.availability_status),
    featured: Boolean(row.featured),
    category: toFleetCategory(price),
    imageUrl,
  }
}

export function mapFleetRowToCar(row: FleetCarRow): Car {
  const price = Number(row.pricing_per_day)
  const imageUrl = resolveRowPrimaryImage(row)
  const gallery = resolveRowGallery(row, imageUrl)
  const name = `${row.brand} ${row.model}`.trim()
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
    securityDeposit: Number(row.security_deposit),
  }
}
