import { normalizeAppAuthRole, type AppAuthRole } from '@/lib/auth/roles'

import type { OnboardingTrack } from '@/lib/admin/help-center/types'

export const ONBOARDING_TRACKS: OnboardingTrack[] = [
  {
    role: 'all_staff',
    title: 'Oxour Go admin — first day',
    description: 'Essential orientation for every staff member before touching live bookings.',
    steps: [
      {
        id: 'o1',
        title: 'Open the command center',
        description: 'Review live metrics, queues, and alerts on the home dashboard.',
        href: '/admin',
      },
      {
        id: 'o2',
        title: 'Read roles & permissions',
        description: 'Understand what your login can and cannot do.',
        href: '/admin/help/staff-roles-permissions',
        articleSlug: 'staff-roles-permissions',
      },
      {
        id: 'o3',
        title: 'Bookmark help center',
        description: 'Search SOPs anytime from Admin → Help.',
        href: '/admin/help',
      },
      {
        id: 'o4',
        title: 'Review emergency SOP',
        description: 'Know the first steps for accidents and safety incidents.',
        href: '/admin/help/emergency-incident',
        articleSlug: 'emergency-incident',
      },
    ],
  },
  {
    role: 'support_agent',
    title: 'Support agent track',
    description: 'Customer-facing workflows without financial write access.',
    steps: [
      { id: 'sa1', title: 'Customer support SOP', description: 'Triage and tone guidelines.', href: '/admin/help/customer-support', articleSlug: 'customer-support' },
      { id: 'sa2', title: 'Booking operations', description: 'Lifecycle and holds.', href: '/admin/help/booking-operations', articleSlug: 'booking-operations' },
      { id: 'sa3', title: 'KYC overview', description: 'When to escalate to reviewers.', href: '/admin/help/kyc-verification', articleSlug: 'kyc-verification' },
      { id: 'sa4', title: 'WhatsApp inbox', description: 'Operational conversations.', href: '/admin/whatsapp' },
    ],
  },
  {
    role: 'fleet_manager',
    title: 'Fleet & handover track',
    description: 'Vehicle catalog, inspections, and trip start/end.',
    steps: [
      { id: 'fm1', title: 'Fleet catalog', description: 'Availability and maintenance modes.', href: '/admin/fleet' },
      { id: 'fm2', title: 'Handover SOP', description: 'Pickup inspection and activate trip.', href: '/admin/help/vehicle-handover', articleSlug: 'vehicle-handover' },
      { id: 'fm3', title: 'Return inspection SOP', description: 'Close-out and damage capture.', href: '/admin/help/vehicle-return-inspection', articleSlug: 'vehicle-return-inspection' },
      { id: 'fm4', title: 'Manual operations', description: 'Holds, swaps, fleet emergency.', href: '/admin/operations' },
    ],
  },
  {
    role: 'finance_manager',
    title: 'Finance track',
    description: 'Payments, deposits, refunds, and violations.',
    steps: [
      { id: 'fin1', title: 'Payment collection', description: 'Ledger and partial pay.', href: '/admin/help/payment-collection', articleSlug: 'payment-collection' },
      { id: 'fin2', title: 'Deposits & refunds', description: 'Post-return money flow.', href: '/admin/help/deposit-refund', articleSlug: 'deposit-refund' },
      { id: 'fin3', title: 'Traffic fines', description: 'Violations and challans.', href: '/admin/help/traffic-fine-management', articleSlug: 'traffic-fine-management' },
      { id: 'fin4', title: 'Payments board', description: 'Daily collections queue.', href: '/admin/payments' },
      { id: 'fin5', title: 'Exports', description: 'Backup & DR data exports.', href: '/admin/backup' },
    ],
  },
  {
    role: 'kyc_reviewer',
    title: 'KYC reviewer track',
    description: 'Document review queue only.',
    steps: [
      { id: 'kyc1', title: 'KYC verification SOP', description: 'Standards and decisions.', href: '/admin/help/kyc-verification', articleSlug: 'kyc-verification' },
      { id: 'kyc2', title: 'KYC queue', description: 'Daily worklist.', href: '/admin/kyc' },
    ],
  },
  {
    role: 'ops_admin',
    title: 'Operations lead track',
    description: 'Full platform mastery including overrides and audit.',
    steps: [
      { id: 'ops1', title: 'All core SOPs', description: 'Skim each procedure once.', href: '/admin/help' },
      { id: 'ops2', title: 'Operations desk', description: 'Overrides and manual booking.', href: '/admin/operations' },
      { id: 'ops3', title: 'Audit log', description: 'Staff action history.', href: '/admin/audit' },
      { id: 'ops4', title: 'User management', description: 'Roles and access.', href: '/admin/users' },
      { id: 'ops5', title: 'Backup & recovery', description: 'Exports and archive restore.', href: '/admin/backup' },
    ],
  },
]

export function getOnboardingTracksForRole(role: AppAuthRole): OnboardingTrack[] {
  const canonical = normalizeAppAuthRole(role) ?? role
  const general = ONBOARDING_TRACKS.filter((t) => t.role === 'all_staff')
  const specific = ONBOARDING_TRACKS.filter((t) => t.role === canonical)
  return [...general, ...specific]
}
