/**
 * Routes disabled during inquiry-only soft launch — redirected to WhatsApp concierge.
 */

const DISABLED_PREFIXES = [
  '/booking',
  '/dashboard',
  '/kyc',
  '/profile',
  '/admin',
  '/login',
] as const

export function isSoftLaunchDisabledRoute(pathname: string): boolean {
  const path = pathname.split('?')[0] ?? pathname
  return DISABLED_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))
}

export function softLaunchInquiryMessageForPath(pathname: string): string {
  const path = pathname.split('?')[0] ?? pathname
  if (path.startsWith('/booking') || path.startsWith('/car/')) {
    return 'Hi Oxour Go, I want to book a luxury self-drive in Mumbai — please help me choose a vehicle and dates.'
  }
  if (path.startsWith('/dashboard/kyc') || path.startsWith('/kyc')) {
    return 'Hi Oxour Go, I want to book a vehicle and need help with identity verification.'
  }
  if (path.startsWith('/dashboard')) {
    return 'Hi Oxour Go, I want to book or manage a reservation — please help on WhatsApp.'
  }
  if (path.startsWith('/admin')) {
    return 'Hi Oxour Go, I want to book a luxury self-drive in Mumbai.'
  }
  if (path.startsWith('/profile')) {
    return 'Hi Oxour Go, I want to book a vehicle and need help updating my profile details.'
  }
  if (path.startsWith('/login')) {
    return 'Hi Oxour Go, I want to book a luxury self-drive in Mumbai.'
  }
  return 'Hi Oxour Go, I want to book a luxury self-drive in Mumbai.'
}
