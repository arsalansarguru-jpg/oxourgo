import type { BookingWithCar, VehicleSummaryRow } from '@/lib/supabase/database.types'
import { getPublicStorageObjectUrl } from '@/lib/supabase/storage-public-url'
import { resolveFleetImageUrl } from '@/lib/fleet/mappers'

/** Customer-facing booking lifecycle labels (maps from DB `booking_status`). */
export type CustomerBookingStatusBadge = 'pending' | 'confirmed' | 'cancelled' | 'completed'

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

function imageFromVehicleRow(brand: string, image: string | null): string {
  const raw = image?.trim()
  if (!raw) return resolveFleetImageUrl(brand)
  if (/^https?:\/\//i.test(raw)) return raw
  return getPublicStorageObjectUrl('fleet', raw) ?? resolveFleetImageUrl(brand)
}

/** Resolves hero image plus name/brand for the `vehicles` join on a booking row. */
export function resolveBookingVehicleVisual(row: BookingWithCar): BookingVehicleVisual {
  const veh = firstVehicle(row.vehicles)
  if (veh) {
    return {
      imageUrl: imageFromVehicleRow(veh.brand, veh.image),
      name: veh.name?.trim() || veh.brand,
      brand: veh.brand,
    }
  }
  return {
    imageUrl: resolveFleetImageUrl(''),
    name: 'Vehicle',
    brand: '',
  }
}

export function mapDbBookingStatusToCustomerBadge(status: string): CustomerBookingStatusBadge {
  switch (status) {
    case 'pending_payment':
      return 'pending'
    case 'confirmed':
      return 'confirmed'
    case 'cancelled':
      return 'cancelled'
    case 'completed':
      return 'completed'
    default:
      return 'confirmed'
  }
}

export function customerBookingStatusLabel(badge: CustomerBookingStatusBadge): string {
  const labels: Record<CustomerBookingStatusBadge, string> = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    cancelled: 'Cancelled',
    completed: 'Completed',
  }
  return labels[badge]
}

const PAYMENT_LABELS: Record<string, string> = {
  pending: 'Pending',
  paid: 'Paid',
  failed: 'Failed',
  refunded: 'Refunded',
  partial: 'Partial',
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
  confirmed: 'success',
  cancelled: 'danger',
  completed: 'muted',
}

export type CustomerPaymentBadgeUiVariant = CustomerBookingStatusBadgeUiVariant | 'default'

const PAYMENT_BADGE_VARIANT: Record<string, CustomerPaymentBadgeUiVariant> = {
  pending: 'electric',
  paid: 'success',
  failed: 'danger',
  refunded: 'muted',
  partial: 'default',
}

export function paymentStatusBadgeVariant(raw: string): CustomerPaymentBadgeUiVariant {
  return PAYMENT_BADGE_VARIANT[raw.trim().toLowerCase()] ?? 'default'
}
