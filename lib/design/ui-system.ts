/**
 * Unified UI class strings — Oxour Go design system (surfaces + typography).
 * Typography tokens: `lib/design/typography.ts` + `app/globals.css` utilities.
 */

import {
  typeAdminPageTitle,
  typeBody,
  typeCaption,
  typeCardTitle,
  typeEyebrow,
  typeFormLabel,
  typeHeroDisplay,
  typeHeroKicker,
  typeLead,
  typeMetricLabel,
  typeMetricValue,
  typeModalTitle,
  typeNavItem,
  typePageTitle,
  typeSectionHeading,
  typeTableBody,
  typeTableHead,
} from '@/lib/design/typography'

export const pageSection = 'py-16 sm:py-20 lg:py-24'
export const pageSectionTight = 'py-12 sm:py-16'

export const contentStack = 'flex min-w-0 flex-col gap-8 sm:gap-10'

export const grid12 = 'grid min-w-0 grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-12 lg:gap-x-8'

export const labelCaps = typeEyebrow

export const textH1 = typePageTitle
export const textH2 = typeCardTitle
export const textLead = typeLead
export const textBody = typeBody
export const textMeta = typeCaption

export const surface =
  'rounded-2xl border border-stroke bg-carbon/90 shadow-[var(--shadow-card)] backdrop-blur-xl'

export const glassSurface =
  'rounded-2xl border border-stroke bg-fill-glass-strong shadow-[var(--shadow-card)] backdrop-blur-2xl'

export const divider = 'border-t border-stroke'

export const heroOverlay = 'absolute inset-0 -z-10 bg-[var(--hero-overlay)]'

export const adminShellRoot = 'flex min-h-dvh min-w-0 bg-matte text-soft'

export const adminSidebar =
  'border-r border-stroke bg-carbon-deep/95 backdrop-blur-2xl shadow-[var(--shadow-sidebar)]'

export const marketingHeroSection =
  'relative isolate min-h-[calc(100svh-var(--public-header-offset))] overflow-hidden border-b border-stroke bg-matte text-soft'

/** Re-export typography for convenient imports */
export {
  typeAdminPageTitle,
  typeBody,
  typeCaption,
  typeCardTitle,
  typeEyebrow,
  typeFormLabel,
  typeHeroDisplay,
  typeHeroKicker,
  typeLead,
  typeMetricLabel,
  typeMetricValue,
  typeModalTitle,
  typeNavItem,
  typePageTitle,
  typeSectionHeading,
  typeTableBody,
  typeTableHead,
}
