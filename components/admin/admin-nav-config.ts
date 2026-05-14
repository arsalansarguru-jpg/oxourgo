import {
  Banknote,
  BarChart3,
  CarFront,
  ClipboardList,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Users,
} from 'lucide-react'

/** Primary admin navigation — order matches luxury SaaS IA. */
export const ADMIN_NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/bookings', label: 'Bookings', icon: ClipboardList, exact: false },
  { href: '/admin/fleet', label: 'Fleet', icon: CarFront, exact: false },
  { href: '/admin/customers', label: 'Customers', icon: Users, exact: false },
  { href: '/admin/kyc', label: 'KYC', icon: ShieldCheck, exact: false },
  { href: '/admin/payments', label: 'Payments', icon: Banknote, exact: false },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3, exact: false },
  { href: '/admin/settings', label: 'Settings', icon: Settings, exact: false },
] as const

export type AdminNavItem = (typeof ADMIN_NAV)[number]

const SIDEBAR_COLLAPSE_KEY = 'oxour-admin-sidebar-collapsed'

export function readAdminSidebarCollapsed(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(SIDEBAR_COLLAPSE_KEY) === '1'
  } catch {
    return false
  }
}

export function writeAdminSidebarCollapsed(collapsed: boolean): void {
  try {
    window.localStorage.setItem(SIDEBAR_COLLAPSE_KEY, collapsed ? '1' : '0')
  } catch {
    /* ignore */
  }
}

/** Short label for the sticky top bar (derived from the path). */
export function adminTopBarTitle(pathname: string): string {
  if (pathname === '/admin' || pathname === '/admin/') return 'Dashboard'
  if (pathname.startsWith('/admin/fleet/new')) return 'New vehicle'
  if (pathname.startsWith('/admin/fleet/')) return 'Fleet detail'
  if (pathname.startsWith('/admin/fleet')) return 'Fleet'
  if (pathname.startsWith('/admin/bookings/')) return 'Booking detail'
  if (pathname.startsWith('/admin/bookings')) return 'Bookings'
  if (pathname.startsWith('/admin/customers/')) return 'Customer detail'
  if (pathname.startsWith('/admin/customers')) return 'Customers'
  if (pathname.startsWith('/admin/kyc')) return 'KYC'
  if (pathname.startsWith('/admin/payments')) return 'Payments'
  if (pathname.startsWith('/admin/analytics')) return 'Analytics'
  if (pathname.startsWith('/admin/settings')) return 'Settings'
  if (pathname.startsWith('/admin/notifications')) return 'Alerts'
  return 'Admin'
}
