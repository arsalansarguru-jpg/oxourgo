import { describe, expect, it } from 'vitest'

import { bookingCollectedRupees } from '@/lib/admin/booking-financials'

describe('bookingCollectedRupees', () => {
  it('counts amount_paid even when payment_status is pending', () => {
    expect(
      bookingCollectedRupees({
        booking_status: 'pending_payment',
        payment_status: 'pending',
        amount_paid: 12000,
        total_rupees: 55225,
      }),
    ).toBe(12000)
  })

  it('returns 0 for cancelled bookings', () => {
    expect(
      bookingCollectedRupees({
        booking_status: 'cancelled',
        payment_status: 'received',
        amount_paid: 5000,
      }),
    ).toBe(0)
  })
})
