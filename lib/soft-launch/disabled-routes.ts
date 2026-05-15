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
    return "Hi Oxour Go, I'd like help completing a booking inquiry for a vehicle on your website."
  }
  if (path.startsWith('/dashboard/kyc') || path.startsWith('/kyc')) {
    return "Hi Oxour Go, I'd like help with identity verification for a self-drive booking."
  }
  if (path.startsWith('/dashboard')) {
    return "Hi Oxour Go, I'd like help with my reservation or account on your website."
  }
  if (path.startsWith('/admin')) {
    return "Hi Oxour Go, I'm reaching out regarding operations on the website."
  }
  if (path.startsWith('/profile')) {
    return "Hi Oxour Go, I'd like to update my profile details for a booking inquiry."
  }
  if (path.startsWith('/login')) {
    return "Hi Oxour Go, I'd like to inquire about booking a luxury self-drive in Mumbai."
  }
  return "Hi Oxour Go, I'd like to book a luxury self-drive in Mumbai."
}
