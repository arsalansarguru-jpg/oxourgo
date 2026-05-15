import type { AppAuthRole } from '@/lib/auth/roles'
import type { LucideIcon } from 'lucide-react'

export type TrainingTrack = 'operations' | 'owner'

export type TrainingStep = {
  id: string
  title: string
  body: string
  /** Optional pro tip shown in callout */
  tip?: string
  adminHref?: string
  helpSlug?: string
}

export type TrainingModule = {
  slug: string
  title: string
  description: string
  track: TrainingTrack
  roles: AppAuthRole[] | 'all'
  keywords: string[]
  estimatedMinutes: number
  objectives: string[]
  steps: TrainingStep[]
  relatedLinks: { label: string; href: string }[]
}

export type TrainingRoleGuide = {
  role: AppAuthRole | 'all_staff'
  title: string
  description: string
  moduleSlugs: string[]
}

export type TrainingOnboardingStep = {
  id: string
  title: string
  description: string
  href: string
  moduleSlug?: string
}

export type TrainingOnboardingTrack = {
  role: AppAuthRole | 'all_staff'
  title: string
  description: string
  steps: TrainingOnboardingStep[]
}

export type TrainingTrackMeta = {
  id: TrainingTrack
  label: string
  description: string
  icon: LucideIcon
}
