import type { Car } from '@/types/car'

export type BookingQuote = {
  rentalDays: number
  subtotalRupees: number
  convenienceFeeRupees: number
  gstRupees: number
  totalRupees: number
}

export type BookingCarPayload = {
  car: Car
  /** ISO timestamps for initial form defaults */
  defaultPickupIso: string
  defaultReturnIso: string
}

export type CreateBookingInput = {
  carId: string
  pickupAtIso: string
  returnAtIso: string
  pickupLocation: string
  returnLocation: string
  /** Defaults to pay_at_pickup. Online requires Razorpay + PAYMENTS_ONLINE_CHECKOUT_ENABLED=1. */
  paymentMethod?: 'pay_at_pickup' | 'online_payment' | 'pay_online'
}

export type CreateBookingSuccess = {
  ok: true
  bookingId: string
  totalRupees: number
}

export type CreateBookingFailure = {
  ok: false
  code:
    | 'unauthorized'
    | 'validation'
    | 'car_unavailable'
    | 'overlap'
    | 'rpc_missing'
    | 'database'
    | 'kyc_required'
    | 'concierge_only'
    | 'unknown'
  message: string
}

export type CreateBookingResult = CreateBookingSuccess | CreateBookingFailure
