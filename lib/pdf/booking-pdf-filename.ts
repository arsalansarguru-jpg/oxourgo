import type { BookingPdfDocKind } from '@/lib/pdf/booking-payload'

export function bookingPdfFilename(bookingId: string, doc: BookingPdfDocKind): string {
  const short = bookingId.replace(/-/g, '').slice(0, 8)
  return `oxour-go-${doc}-${short}.pdf`
}
