import { BOOKING_SOURCES, type BookingSource } from '@/lib/whatsapp/types'

export { BOOKING_SOURCES, type BookingSource }

export function normalizeBookingSource(raw: string | null | undefined): BookingSource {
  const v = (raw ?? 'website').trim().toLowerCase()
  if (v === 'whatsapp' || v === 'admin_manual') return v
  return 'website'
}

export function formatBookingSourceLabel(source: string | null | undefined): string {
  switch (normalizeBookingSource(source)) {
    case 'whatsapp':
      return 'WhatsApp'
    case 'admin_manual':
      return 'Admin manual'
    default:
      return 'Website'
  }
}
