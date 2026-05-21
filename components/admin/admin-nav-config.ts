import {
  Banknote,
  BarChart3,
  Bell,
  CarFront,
  ClipboardList,
  Gavel,
  Headphones,
  LayoutDashboard,
  MapPin,
  Scale,
  Settings,
  ShieldCheck,
  UserCog,
  Users,
  Wrench,
} from 'lucide-react'

import type { Permission } from '@/lib/auth/permissions'
import { ADMIN_HOME } from '@/lib/auth/routes'

export type AdminNavItem = {
  href: string
  label: string
  icon: typeof LayoutDashboard
  exact: boolean
  permission: Permission
}

/** Enterprise admin navigation — 14 operational sections. */
export const ADMIN_NAV: readonly AdminNavItem[] = [
  { href: ADMIN_HOME, label: 'Dashboard', icon: LayoutDashboard, exact: true, permission: 'admin.dashboard.read' },
  { href: '/admin/fleet', label: 'Fleet', icon: CarFront, exact: false, permission: 'fleet.read' },
  { href: '/admin/bookings', label: 'Bookings', icon: ClipboardList, exact: false, permission: 'bookings.read' },
  { href: '/admin/kyc', label: 'KYC Verification', icon: ShieldCheck, exact: false, permission: 'kyc.read' },
  { href: '/admin/payments', label: 'Payments', icon: Banknote, exact: false, permission: 'payments.read' },
  { href: '/admin/financials', label: 'Deposits', icon: Scale, exact: false, permission: 'deposits.read' },
  { href: '/admin/customers', label: 'Customers', icon: Users, exact: false, permission: 'customers.read' },
  { href: '/admin/tracking', label: 'Vehicle Tracking', icon: MapPin, exact: false, permission: 'tracking.read' },
  { href: '/admin/damage', label: 'Damage & Penalties', icon: Wrench, exact: false, permission: 'damage.read' },
  { href: '/admin/traffic', label: 'Traffic Fines', icon: Gavel, exact: false, permission: 'traffic.read' },
  { href: '/admin/analytics', label: 'Reports', icon: BarChart3, exact: false, permission: 'analytics.read' },
  { href: '/admin/notifications', label: 'Notifications', icon: Bell, exact: false, permission: 'ops.alerts.read' },
  { href: '/admin/support', label: 'Support Tickets', icon: Headphones, exact: false, permission: 'support.read' },
  { href: '/admin/users', label: 'Staff', icon: UserCog, exact: false, permission: 'admin.users.manage' },
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
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(SIDEBAR_COLLAPSE_KEY, collapsed ? '1' : '0')
  } catch {
    /* ignore — Safari private mode / disabled storage */
  }
}

/** Short label for the sticky top bar (derived from the path). */
export function adminTopBarTitle(pathname: string): string {
  if (pathname === '/admin' || pathname === '/admin/' || pathname === ADMIN_HOME) return 'Dashboard'
  if (pathname.startsWith('/admin/fleet/new')) return 'New vehicle'
  if (pathname.startsWith('/admin/fleet/')) return 'Fleet detail'
  if (pathname.startsWith('/admin/fleet')) return 'Fleet'
  if (pathname.startsWith('/admin/bookings/')) return 'Booking detail'
  if (pathname.startsWith('/admin/bookings')) return 'Bookings'
  if (pathname.startsWith('/admin/operations')) return 'Operations'
  if (pathname.startsWith('/admin/whatsapp')) return 'WhatsApp'
  if (pathname.startsWith('/admin/customers/')) return 'Customer detail'
  if (pathname.startsWith('/admin/customers')) return 'Customers'
  if (pathname.startsWith('/admin/kyc')) return 'KYC Verification'
  if (pathname.startsWith('/admin/payments')) return 'Payments'
  if (pathname.startsWith('/admin/financials')) return 'Deposits'
  if (pathname.startsWith('/admin/tracking')) return 'Vehicle Tracking'
  if (pathname.startsWith('/admin/damage')) return 'Damage & Penalties'
  if (pathname.startsWith('/admin/traffic')) return 'Traffic Fines'
  if (pathname.startsWith('/admin/analytics')) return 'Reports & Analytics'
  if (pathname.startsWith('/admin/notifications')) return 'Notifications'
  if (pathname.startsWith('/admin/support')) return 'Support Tickets'
  if (pathname.startsWith('/admin/violations')) return 'Violations'
  if (pathname.startsWith('/admin/audit')) return 'Audit log'
  if (pathname.startsWith('/admin/help/onboarding')) return 'Onboarding'
  if (pathname.startsWith('/admin/help/')) return 'Procedure'
  if (pathname.startsWith('/admin/help')) return 'Help & SOPs'
  if (pathname.startsWith('/admin/training/onboarding')) return 'Walkthroughs'
  if (pathname.startsWith('/admin/training/guides')) return 'Role guides'
  if (pathname.startsWith('/admin/training/')) return 'Tutorial'
  if (pathname.startsWith('/admin/training')) return 'Training'
  if (pathname.startsWith('/admin/backup')) return 'Backup & recovery'
  if (pathname.startsWith('/admin/launch')) return 'Launch control'
  if (pathname.startsWith('/admin/users')) return 'Staff Management'
  if (pathname.startsWith('/admin/settings')) return 'Settings'
  if (pathname.startsWith('/admin/forbidden')) return 'Access restricted'
  return 'Admin'
}
