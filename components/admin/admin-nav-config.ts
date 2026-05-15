import {
  Banknote,
  BarChart3,
  CarFront,
  ClipboardList,
  Gavel,
  LayoutDashboard,
  Scale,
  Settings,
  ShieldCheck,
  UserCog,
  Users,
} from 'lucide-react'

import type { Permission } from '@/lib/auth/permissions'

export type AdminNavItem = {
  href: string
  label: string
  icon: typeof LayoutDashboard
  exact: boolean
  permission: Permission
}

/** Primary admin navigation — order matches luxury SaaS IA. */
export const ADMIN_NAV: readonly AdminNavItem[] = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true, permission: 'admin.dashboard.read' },
  { href: '/admin/bookings', label: 'Bookings', icon: ClipboardList, exact: false, permission: 'bookings.read' },
  { href: '/admin/fleet', label: 'Fleet', icon: CarFront, exact: false, permission: 'fleet.read' },
  { href: '/admin/customers', label: 'Customers', icon: Users, exact: false, permission: 'customers.read' },
  { href: '/admin/kyc', label: 'KYC', icon: ShieldCheck, exact: false, permission: 'kyc.read' },
  { href: '/admin/payments', label: 'Payments', icon: Banknote, exact: false, permission: 'payments.read' },
  { href: '/admin/financials', label: 'Deposits', icon: Scale, exact: false, permission: 'deposits.read' },
  { href: '/admin/violations', label: 'Violations', icon: Gavel, exact: false, permission: 'penalties.read' },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3, exact: false, permission: 'analytics.read' },
  { href: '/admin/users', label: 'Users', icon: UserCog, exact: false, permission: 'admin.users.manage' },
  { href: '/admin/settings', label: 'Settings', icon: Settings, exact: false, permission: 'settings.read' },
] as const

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
  if (pathname.startsWith('/admin/financials')) return 'Deposits'
  if (pathname.startsWith('/admin/violations')) return 'Violations'
  if (pathname.startsWith('/admin/analytics')) return 'Analytics'
  if (pathname.startsWith('/admin/users')) return 'Users'
  if (pathname.startsWith('/admin/settings')) return 'Settings'
  if (pathname.startsWith('/admin/notifications')) return 'Alerts'
  if (pathname.startsWith('/admin/forbidden')) return 'Access restricted'
  return 'Admin'
}
