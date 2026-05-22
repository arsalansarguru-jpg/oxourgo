import type { BookingWithCar } from '@/lib/supabase/database.types'

import { getPublicSiteUrl } from '@/lib/env/site-url'
import { safeRupees } from '@/lib/money/safe'
import { BRAND } from '@/constants/brand'

export type BookingPdfDocKind = 'confirmation' | 'invoice' | 'summary'

export type BookingPdfPayload = {
  docKind: BookingPdfDocKind
  generatedAtIso: string
  siteUrl: string
  termsUrl: string
  brandName: string
  brandTagline: string
  supportEmail: string
  supportPhone: string
  bookingId: string
  invoiceRef: string
  bookingStatus: string
  paymentStatus: string
  customerName: string | null
  customerEmail: string | null
  customerPhone: string | null
  vehicleName: string
  vehicleBrand: string
  vehicleReg: string | null
  vehicleYear: number | null
  transmission: string | null
  fuelType: string | null
  seats: number | null
  pickupAt: string
  returnAt: string
  pickupLocation: string
  returnLocation: string
  rentalDays: number
  pricePerDaySnapshot: number
  subtotalRupees: number
  convenienceFeeRupees: number
  gstRupees: number
  totalRupees: number
  securityDepositRupees: number | null
}

function resolveVehicle(row: BookingWithCar) {
  const v = row.vehicles
  if (!v) return null
  return Array.isArray(v) ? v[0] ?? null : v
}

export function buildInvoiceRef(bookingId: string): string {
  return `OX-${bookingId.replace(/-/g, '').slice(0, 10).toUpperCase()}`
}

export function buildBookingPdfPayload(
  row: BookingWithCar,
  docKind: BookingPdfDocKind,
  customer: { name: string | null; email: string | null; phone: string | null },
): BookingPdfPayload {
  const v = resolveVehicle(row)
  const siteUrl = getPublicSiteUrl()
  const vehicleName = v?.name?.trim() || 'Vehicle'
  const vehicleBrand = v?.brand?.trim() || '—'

  return {
    docKind,
    generatedAtIso: new Date().toISOString(),
    siteUrl,
    termsUrl: `${siteUrl}/terms`,
    brandName: BRAND.name,
    brandTagline: BRAND.tagline,
    supportEmail: BRAND.email,
    supportPhone: BRAND.phoneDisplay,
    bookingId: row.id,
    invoiceRef: buildInvoiceRef(row.id),
    bookingStatus: row.booking_status,
    paymentStatus: row.payment_status,
    customerName: customer.name,
    customerEmail: customer.email,
    customerPhone: customer.phone,
    vehicleName,
    vehicleBrand,
    vehicleReg: v?.registration_number?.trim() ?? null,
    vehicleYear: v?.year ?? null,
    transmission: v?.transmission?.trim() ?? null,
    fuelType: v?.fuel_type?.trim() ?? null,
    seats: v?.seats ?? null,
    pickupAt: row.pickup_date,
    returnAt: row.return_date,
    pickupLocation: row.pickup_location,
    returnLocation: row.return_location,
    rentalDays: row.rental_days,
    pricePerDaySnapshot: row.price_per_day_rupees_snapshot,
    subtotalRupees: safeRupees(row.subtotal_rupees),
    convenienceFeeRupees: safeRupees(row.convenience_fee_rupees),
    gstRupees: safeRupees(row.gst_rupees),
    totalRupees: safeRupees(row.total_rupees),
    securityDepositRupees:
      safeRupees(row.deposit_amount, -1) > 0
        ? safeRupees(row.deposit_amount)
        : v?.security_deposit != null
          ? safeRupees(v.security_deposit)
          : null,
  }
}

export function parseBookingPdfDocKind(raw: string | null): BookingPdfDocKind | null {
  const v = (raw ?? '').trim().toLowerCase()
  if (v === 'confirmation' || v === 'invoice' || v === 'summary') return v
  return null
}
