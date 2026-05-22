import { fleetCatalogTitle } from '@/lib/admin/fleet-display'
import type { BookingWithCar, VehicleSummaryRow } from '@/lib/supabase/database.types'
import { getPublicStorageObjectUrl } from '@/lib/supabase/storage-public-url'
import { VEHICLE_IMAGE_FALLBACK } from '@/constants/vehicle-media'

/** Customer-facing booking lifecycle labels (maps from DB `booking_status`). */
export type CustomerBookingStatusBadge = 'pending' | 'scheduled' | 'on_trip' | 'cancelled' | 'completed'

export type BookingVehicleVisual = {
  imageUrl: string
  /** Display title (e.g. full listing name or “Brand Model”). */
  name: string
  brand: string
}

function firstVehicle(vehicles: BookingWithCar['vehicles']): VehicleSummaryRow | null {
  if (!vehicles) return null
  return Array.isArray(vehicles) ? vehicles[0] ?? null : vehicles
}

/** Full listing title for dashboards (brand + model when `name` is model-only). */
export function formatBookingVehicleTitle(row: BookingWithCar): string {
  const veh = firstVehicle(row.vehicles)
  if (!veh) return 'Vehicle'
  return fleetCatalogTitle({
    id: veh.id ?? row.vehicle_id ?? 'vehicle',
    name: veh.name,
    brand: veh.brand,
    registration_number: (veh as { registration_number?: string | null }).registration_number ?? null,
  })
}

function imageFromVehicleRow(image: string | null): string {
  const raw = image?.trim()
  if (!raw) return VEHICLE_IMAGE_FALLBACK
  if (/^https?:\/\//i.test(raw)) return raw
  return getPublicStorageObjectUrl('fleet', raw) ?? VEHICLE_IMAGE_FALLBACK
}

/** Resolves hero image plus name/brand for the `vehicles` join on a booking row. */
export function resolveBookingVehicleVisual(row: BookingWithCar): BookingVehicleVisual {
  const veh = firstVehicle(row.vehicles)
  if (veh) {
    const title = formatBookingVehicleTitle(row)
    return {
      imageUrl: imageFromVehicleRow(veh.image),
      name: title,
      brand: veh.brand,
    }
  }
  return {
    imageUrl: VEHICLE_IMAGE_FALLBACK,
    name: 'Vehicle',
    brand: '',
  }
}

export function mapDbBookingStatusToCustomerBadge(status: string): CustomerBookingStatusBadge {
  switch (status) {
    case 'pending_payment':
      return 'pending'
    case 'confirmed':
      return 'scheduled'
    case 'active':
      return 'on_trip'
    case 'cancelled':
      return 'cancelled'
    case 'completed':
      return 'completed'
    default:
      return 'scheduled'
  }
}

export function customerBookingStatusLabel(badge: CustomerBookingStatusBadge): string {
  const labels: Record<CustomerBookingStatusBadge, string> = {
    pending: 'Pending review',
    scheduled: 'Pickup scheduled',
    on_trip: 'Active trip',
    cancelled: 'Cancelled',
    completed: 'Completed',
  }
  return labels[badge]
}

const PAYMENT_LABELS: Record<string, string> = {
  pending: 'Pending',
  received: 'Received',
  partial: 'Partial payment',
  refunded: 'Refunded',
  authorized: 'Received',
  paid: 'Received',
  failed: 'Pending',
}

/** Human-readable payment status for dashboard UI. */
export function formatPaymentStatusLabel(raw: string): string {
  const key = raw.trim().toLowerCase()
  if (PAYMENT_LABELS[key]) return PAYMENT_LABELS[key]
  if (!raw) return '—'
  return raw
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export type CustomerBookingStatusBadgeUiVariant = 'electric' | 'success' | 'danger' | 'muted'

/** Maps customer booking lifecycle badge to `Badge` variant (shared across dashboard booking UI). */
export const CUSTOMER_BOOKING_STATUS_BADGE_VARIANT: Record<
  CustomerBookingStatusBadge,
  CustomerBookingStatusBadgeUiVariant
> = {
  pending: 'electric',
  scheduled: 'success',
  on_trip: 'electric',
  cancelled: 'danger',
  completed: 'muted',
}

export type CustomerPaymentBadgeUiVariant = CustomerBookingStatusBadgeUiVariant | 'default'

const PAYMENT_BADGE_VARIANT: Record<string, CustomerPaymentBadgeUiVariant> = {
  pending: 'electric',
  received: 'success',
  partial: 'default',
  refunded: 'muted',
  authorized: 'success',
  paid: 'success',
  failed: 'electric',
}

export function paymentStatusBadgeVariant(raw: string): CustomerPaymentBadgeUiVariant {
  return PAYMENT_BADGE_VARIANT[raw.trim().toLowerCase()] ?? 'default'
}
