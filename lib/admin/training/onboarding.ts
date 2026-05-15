import { normalizeAppAuthRole, type AppAuthRole } from '@/lib/auth/roles'

import type { TrainingOnboardingTrack } from '@/lib/admin/training/types'

export const TRAINING_ONBOARDING_TRACKS: TrainingOnboardingTrack[] = [
  {
    role: 'all_staff',
    title: 'Day 1 — Training portal',
    description: 'Complete these walkthroughs before handling live customer data.',
    steps: [
      {
        id: 't1',
        title: 'Training home',
        description: 'Bookmark the internal training center.',
        href: '/admin/training',
      },
      {
        id: 't2',
        title: 'Login & dashboard tutorial',
        description: '15-minute orientation to the command center.',
        href: '/admin/training/login-dashboard-overview',
        moduleSlug: 'login-dashboard-overview',
      },
      {
        id: 't3',
        title: 'Emergency module',
        description: 'Safety-first incident steps.',
        href: '/admin/training/emergency-incident-handling',
        moduleSlug: 'emergency-incident-handling',
      },
      {
        id: 't4',
        title: 'Formal SOPs',
        description: 'Reference Help when executing live tasks.',
        href: '/admin/help',
      },
    ],
  },
  {
    role: 'support_agent',
    title: 'Support onboarding',
    description: 'Booking and customer coordination track.',
    steps: [
      { id: 'sa1', title: 'Role guide', description: 'Your curated module list.', href: '/admin/training/guides' },
      { id: 'sa2', title: 'Booking operations', description: 'Lifecycle tutorial.', href: '/admin/training/booking-operations', moduleSlug: 'booking-operations' },
      { id: 'sa3', title: 'KYC overview', description: 'When to escalate.', href: '/admin/training/kyc-verification', moduleSlug: 'kyc-verification' },
      { id: 'sa4', title: 'WhatsApp inbox', description: 'Live conversations.', href: '/admin/whatsapp' },
    ],
  },
  {
    role: 'fleet_manager',
    title: 'Fleet onboarding',
    description: 'Handover and return mastery.',
    steps: [
      { id: 'fm1', title: 'Role guide', description: 'Fleet module path.', href: '/admin/training/guides' },
      { id: 'fm2', title: 'Handover workflow', description: 'Pickup tutorial.', href: '/admin/training/vehicle-handover-workflow', moduleSlug: 'vehicle-handover-workflow' },
      { id: 'fm3', title: 'Return workflow', description: 'Close-out tutorial.', href: '/admin/training/return-inspection-workflow', moduleSlug: 'return-inspection-workflow' },
      { id: 'fm4', title: 'Fleet catalog', description: 'Vehicle admin.', href: '/admin/fleet' },
    ],
  },
  {
    role: 'finance_manager',
    title: 'Finance onboarding',
    description: 'Money flows and owner reporting.',
    steps: [
      { id: 'fin1', title: 'Role guide', description: 'Finance module path.', href: '/admin/training/guides' },
      { id: 'fin2', title: 'Payments', description: 'Collection tutorial.', href: '/admin/training/payment-management', moduleSlug: 'payment-management' },
      { id: 'fin3', title: 'Deposits & refunds', description: 'Post-return money.', href: '/admin/training/deposit-refund-handling', moduleSlug: 'deposit-refund-handling' },
      { id: 'fin4', title: 'Owner: revenue', description: 'Analytics for leadership.', href: '/admin/training/owner-revenue-tracking', moduleSlug: 'owner-revenue-tracking' },
    ],
  },
  {
    role: 'kyc_reviewer',
    title: 'KYC onboarding',
    description: 'Verification queue only.',
    steps: [
      { id: 'kyc1', title: 'KYC tutorial', description: 'Review standards.', href: '/admin/training/kyc-verification', moduleSlug: 'kyc-verification' },
      { id: 'kyc2', title: 'Live queue', description: 'Daily worklist.', href: '/admin/kyc' },
    ],
  },
  {
    role: 'ops_admin',
    title: 'Ops lead onboarding',
    description: 'Full platform and owner dashboards.',
    steps: [
      { id: 'ops1', title: 'Complete role guide', description: 'All 14 modules.', href: '/admin/training/guides' },
      { id: 'ops2', title: 'Staff roles', description: 'User management tutorial.', href: '/admin/training/staff-role-management', moduleSlug: 'staff-role-management' },
      { id: 'ops3', title: 'Owner monitoring', description: 'Leadership dashboards.', href: '/admin/training/owner-operational-monitoring', moduleSlug: 'owner-operational-monitoring' },
      { id: 'ops4', title: 'Launch center', description: 'Go-live checklist.', href: '/admin/launch' },
    ],
  },
]

export function getTrainingOnboardingForRole(role: AppAuthRole): TrainingOnboardingTrack[] {
  const canonical = normalizeAppAuthRole(role) ?? role
  const general = TRAINING_ONBOARDING_TRACKS.filter((t) => t.role === 'all_staff')
  const specific = TRAINING_ONBOARDING_TRACKS.filter((t) => t.role === canonical)
  return [...general, ...specific]
}
