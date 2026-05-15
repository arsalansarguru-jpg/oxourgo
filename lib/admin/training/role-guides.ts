import { normalizeAppAuthRole, type AppAuthRole } from '@/lib/auth/roles'

import type { TrainingRoleGuide } from '@/lib/admin/training/types'

export const TRAINING_ROLE_GUIDES: TrainingRoleGuide[] = [
  {
    role: 'all_staff',
    title: 'Everyone — start here',
    description: 'Core modules every staff member should complete in week one.',
    moduleSlugs: [
      'login-dashboard-overview',
      'booking-operations',
      'emergency-incident-handling',
    ],
  },
  {
    role: 'support_agent',
    title: 'Support agent',
    description: 'Customer-facing workflows and booking coordination.',
    moduleSlugs: [
      'login-dashboard-overview',
      'booking-operations',
      'kyc-verification',
      'payment-management',
      'vehicle-handover-workflow',
      'return-inspection-workflow',
      'emergency-incident-handling',
    ],
  },
  {
    role: 'fleet_manager',
    title: 'Fleet manager',
    description: 'Vehicle catalog, inspections, and trip lifecycle.',
    moduleSlugs: [
      'login-dashboard-overview',
      'booking-operations',
      'vehicle-handover-workflow',
      'return-inspection-workflow',
      'penalty-fine-management',
      'emergency-incident-handling',
    ],
  },
  {
    role: 'finance_manager',
    title: 'Finance manager',
    description: 'Payments, deposits, fines, and owner reporting.',
    moduleSlugs: [
      'login-dashboard-overview',
      'payment-management',
      'deposit-refund-handling',
      'penalty-fine-management',
      'owner-revenue-tracking',
      'owner-pending-dues',
      'owner-fleet-analytics',
      'owner-operational-monitoring',
    ],
  },
  {
    role: 'kyc_reviewer',
    title: 'KYC reviewer',
    description: 'Identity verification queue focus.',
    moduleSlugs: ['login-dashboard-overview', 'kyc-verification', 'emergency-incident-handling'],
  },
  {
    role: 'ops_admin',
    title: 'Operations admin',
    description: 'Full platform including users, launch, and owner dashboards.',
    moduleSlugs: [
      'login-dashboard-overview',
      'booking-operations',
      'kyc-verification',
      'payment-management',
      'deposit-refund-handling',
      'vehicle-handover-workflow',
      'return-inspection-workflow',
      'penalty-fine-management',
      'staff-role-management',
      'emergency-incident-handling',
      'owner-revenue-tracking',
      'owner-pending-dues',
      'owner-fleet-analytics',
      'owner-operational-monitoring',
    ],
  },
]

export function getRoleGuidesForRole(role: AppAuthRole): TrainingRoleGuide[] {
  const canonical = normalizeAppAuthRole(role) ?? role
  const general = TRAINING_ROLE_GUIDES.filter((g) => g.role === 'all_staff')
  const specific = TRAINING_ROLE_GUIDES.filter((g) => g.role === canonical)
  return [...general, ...specific]
}
