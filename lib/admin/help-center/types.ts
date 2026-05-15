import type { AppAuthRole } from '@/lib/auth/roles'
import type { LucideIcon } from 'lucide-react'

export type HelpCategory = 'operations' | 'finance' | 'fleet' | 'compliance' | 'people' | 'safety'

export type HelpArticleSection = {
  id: string
  title: string
  body: string
}

export type HelpChecklistItem = {
  id: string
  label: string
  critical?: boolean
}

export type HelpRelatedLink = {
  label: string
  href: string
}

export type HelpArticle = {
  slug: string
  title: string
  description: string
  category: HelpCategory
  /** Staff roles this SOP applies to; empty = all staff */
  roles: AppAuthRole[] | 'all'
  keywords: string[]
  estimatedMinutes: number
  sections: HelpArticleSection[]
  checklist: HelpChecklistItem[]
  relatedLinks: HelpRelatedLink[]
  incidentNote?: string
}

export type HelpCategoryMeta = {
  id: HelpCategory
  label: string
  description: string
  icon: LucideIcon
}

export type OnboardingStep = {
  id: string
  title: string
  description: string
  href: string
  articleSlug?: string
}

export type OnboardingTrack = {
  role: AppAuthRole | 'all_staff'
  title: string
  description: string
  steps: OnboardingStep[]
}
