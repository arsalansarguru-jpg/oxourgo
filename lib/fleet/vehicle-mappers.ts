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

export function modelFromListingName(brand: string, name: string): string {
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
 * If `available` is absent, falls back to legacy `availability_status === 'available'` when that field exists on the row.
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

const KNOWN_FLEET_CATEGORIES: FleetCarCategory[] = ['SUV', 'Sedan', 'Hatchback', 'Luxury', 'Budget']

function isFleetCarCategory(value: string | null | undefined): value is FleetCarCategory {
  return Boolean(value && (KNOWN_FLEET_CATEGORIES as readonly string[]).includes(value))
}

/** Normalizes legacy / admin-entered `catalog_category` values before strict enum check (H1). */
function normalizeDbCatalogCategory(raw: string | null | undefined): FleetCarCategory | null {
  const t = raw?.trim()
  if (!t) return null
  if (isFleetCarCategory(t)) return t
  const key = t.toLowerCase()
  const aliases: Record<string, FleetCarCategory> = {
    suv: 'SUV',
    sedan: 'Sedan',
    hatchback: 'Hatchback',
    luxury: 'Luxury',
    budget: 'Budget',
    premium: 'Luxury',
    crossover: 'SUV',
    mpv: 'SUV',
    ev: 'Luxury',
    electric: 'Luxury',
    'luxury sedan': 'Luxury',
    'luxury suv': 'Luxury',
  }
  return aliases[key] ?? null
}

/** Name-aware segment hints so Thar / Creta / Sonet are never mis-tagged as Sedans from price alone (H1). */
function inferCatalogCategoryFromName(row: VehicleRow, pricePerDay: number): FleetCarCategory {
  const blob = `${row.brand} ${row.name}`.toLowerCase()
  const fuel = String(row.fuel_type ?? '')
    .trim()
    .toLowerCase()
  if (fuel === 'electric' || /tesla|byd atto|byd seal|ioniq|e-tron|eqe|eqs|taycan|ev6|zev|nexon ev|i-pace|ix\b|i4\b|macan electric/.test(blob)) {
    if (pricePerDay >= 10_000) return 'Luxury'
    if (
      /thar|creta|sonet|fortuner|scorpio|nexon|harrier|hector|xuv|seltos|venue|elevate|compass|meridian|safari|tucson|kodiaq|gloster|ev6|ioniq/.test(
        blob,
      )
    ) {
      return 'SUV'
    }
    return pricePerDay >= 5000 ? 'Sedan' : 'Hatchback'
  }
  if (
    /thar|creta|sonet|fortuner|scorpio|nexon|harrier|hector|xuv|seltos|venue|elevate|compass|meridian|safari|tucson|kodiaq|gloster/.test(
      blob,
    )
  ) {
    return 'SUV'
  }
  return toFleetCategory(pricePerDay)
}

function resolveCatalogCategory(row: VehicleRow, pricePerDay: number): FleetCarCategory {
  const fromDb = normalizeDbCatalogCategory(row.catalog_category)
  if (fromDb) return fromDb
  return inferCatalogCategoryFromName(row, pricePerDay)
}

function toCarCategory(row: VehicleRow, pricePerDay: number): CarCategory {
  return resolveCatalogCategory(row, pricePerDay)
}

function toCarStatus(row: VehicleRow): CarStatus {
  return isVehicleAvailableForBooking(row) ? 'Available' : 'Unavailable'
}

export function mapVehicleRowToFleetCar(row: VehicleRow): FleetCar {
  const price = parseMoneyIntRupees(row.price_per_day)
  const imageUrl = resolveVehicleImageUrl(row.image, row.brand)
  const listingName = String(row.name ?? '').trim()
  const displayName = listingName || `${row.brand} ${modelFromListingName(row.brand, listingName)}`.trim()
  const year =
    typeof row.year === 'number' && Number.isFinite(row.year) ? row.year : new Date().getFullYear()
  return {
    id: row.id,
    brand: row.brand,
    model: modelFromListingName(row.brand, listingName),
    displayName,
    year,
    registrationNumber: row.registration_number || '—',
    fuel: toFleetFuel(row.fuel_type),
    transmission: toTransmission(row.transmission),
    seats: row.seats,
    pricePerDay: price,
    securityDeposit: parseMoneyIntRupees(row.security_deposit),
    availability: toAvailabilityLabel(row),
    featured: Boolean(row.featured),
    category: resolveCatalogCategory(row, price),
    imageUrl,
    city: row.city,
  }
}

export function mapVehicleRowToCar(row: VehicleRow): Car {
  const price = parseMoneyIntRupees(row.price_per_day)
  const imageUrl = resolveVehicleImageUrl(row.image, row.brand)
  const listingName = String(row.name ?? '').trim()
  const name = listingName || `${row.brand} ${modelFromListingName(row.brand, listingName)}`.trim()
  const gallery = [imageUrl, imageUrl, imageUrl]
  const reg = row.registration_number?.trim()
  const specs: Record<string, string> = {
    Brand: row.brand,
    Year: String(row.year),
    Fuel: toFleetFuel(row.fuel_type),
    Transmission: toTransmission(row.transmission) === 'Auto' ? 'Automatic' : 'Manual',
    Seats: String(row.seats),
  }
  if (reg) specs.Registration = reg
  return {
    id: row.id,
    name,
    status: toCarStatus(row),
    category: toCarCategory(row, price),
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
    specs,
    securityDeposit: parseMoneyIntRupees(row.security_deposit),
  }
}
