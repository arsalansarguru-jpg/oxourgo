/** Primary marketing routes — shared by public header and dashboard escape hatches. */
export const SITE_PRIMARY_NAV = [
  { href: '/', label: 'Home', match: (pathname: string) => pathname === '/' },
  { href: '/fleet', label: 'Fleet', match: (pathname: string) => pathname === '/fleet' || pathname.startsWith('/fleet/') },
  {
    href: '/support',
    label: 'Support',
    match: (pathname: string) => pathname === '/support' || pathname.startsWith('/support/'),
  },
] as const

export const PUBLIC_EXTRA_NAV = [{ href: '/about', label: 'About' }] as const

/** Customer dashboard sidebar (account area). */
export const DASHBOARD_ACCOUNT_NAV = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/dashboard/bookings', label: 'My bookings' },
  { href: '/dashboard/notifications', label: 'Notifications' },
  { href: '/dashboard/kyc', label: 'KYC center' },
  { href: '/dashboard/payments', label: 'Payments' },
  { href: '/dashboard/settings', label: 'Profile' },
] as const

export function isDashboardPath(pathname: string): boolean {
  return pathname === '/dashboard' || pathname.startsWith('/dashboard/')
}
