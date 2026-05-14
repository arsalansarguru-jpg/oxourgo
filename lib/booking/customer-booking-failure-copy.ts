import type { CreateBookingFailure } from '@/lib/booking/types'
import { SAFE_USER_MESSAGE } from '@/lib/errors/safe-user-message'

/** Client-only copy from action `code` — never show `result.message` (could change server-side). */
export function customerBookingFailureCopy(code: CreateBookingFailure['code']): string {
  switch (code) {
    case 'unauthorized':
      return 'Please sign in to complete your booking.'
    case 'validation':
      return 'Please check your trip details and try again.'
    case 'car_unavailable':
      return 'This vehicle is not available to book right now.'
    case 'overlap':
      return 'Those dates are not available. Try different times.'
    case 'rpc_missing':
      return 'Reservations are temporarily unavailable. Please try again shortly.'
    case 'database':
    case 'unknown':
    default:
      return SAFE_USER_MESSAGE.generic
  }
}
