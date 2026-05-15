import {
  AlertTriangle,
  Banknote,
  CarFront,
  ClipboardList,
  ShieldCheck,
  Users,
} from 'lucide-react'

import type { HelpCategoryMeta } from '@/lib/admin/help-center/types'

export const HELP_CATEGORIES: HelpCategoryMeta[] = [
  {
    id: 'operations',
    label: 'Operations',
    description: 'Bookings, support, and daily coordination',
    icon: ClipboardList,
  },
  {
    id: 'finance',
    label: 'Finance',
    description: 'Payments, deposits, fines, and refunds',
    icon: Banknote,
  },
  {
    id: 'fleet',
    label: 'Fleet',
    description: 'Handover, return, and vehicle readiness',
    icon: CarFront,
  },
  {
    id: 'compliance',
    label: 'Compliance',
    description: 'KYC and identity verification',
    icon: ShieldCheck,
  },
  {
    id: 'people',
    label: 'People & access',
    description: 'Roles, permissions, and onboarding',
    icon: Users,
  },
  {
    id: 'safety',
    label: 'Safety & incidents',
    description: 'Emergencies and critical escalations',
    icon: AlertTriangle,
  },
]

export function categoryLabel(id: string): string {
  return HELP_CATEGORIES.find((c) => c.id === id)?.label ?? id
}
