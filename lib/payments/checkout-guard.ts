import 'server-only'

import { isOnlineCheckoutAvailable } from '@/lib/payments/config'

export function assertOnlineCheckoutAllowed(): { ok: true } | { ok: false; message: string } {
  if (!isOnlineCheckoutAvailable()) {
    return {
      ok: false,
      message: 'Online checkout is not available yet. Choose pay at pickup to continue.',
    }
  }
  return { ok: true }
}
