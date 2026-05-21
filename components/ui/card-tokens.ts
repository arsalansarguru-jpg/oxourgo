import { cn } from '@/lib/utils/cn'

/** Standard product card surface */
export const cardSurfaceBase =
  'rounded-2xl border border-stroke bg-fill-glass-strong shadow-[var(--shadow-card)] backdrop-blur-2xl'

export const cardSurfaceTransition =
  'transition-[transform,box-shadow,border-color,background-color] duration-200'

export const cardSurfaceHover =
  'hover:-translate-y-0.5 hover:border-electric/25 hover:shadow-[var(--shadow-card-hover)]'

export const cardSurfaceHoverAccent = cardSurfaceHover

export const cardSurfaceGlass = cardSurfaceBase

export const cardSurfaceGlassHover = cardSurfaceHover

export const cardSurfaceDashed =
  'rounded-2xl border border-dashed border-stroke-strong bg-carbon/80 backdrop-blur-xl transition-colors duration-150 hover:border-electric/30'

export const cardPadding = 'p-5 sm:p-6'
export const cardPaddingCompact = 'p-4 sm:p-5'
export const cardPaddingFeature = cardPadding

export const cardTitle =
  'font-display text-base font-semibold tracking-tight text-soft sm:text-[1.0625rem]'
export const cardBody = 'text-sm font-normal leading-relaxed text-muted'
export const cardEyebrow = 'text-xs font-medium text-muted'

export const cardIconTile =
  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-stroke bg-carbon-deep text-electric'

export const cardMetaChip =
  'inline-flex items-center gap-1.5 rounded-full border border-stroke bg-carbon-deep/90 px-2.5 py-1 text-xs font-medium text-silver'

/** Aliases used by newer design-system tokens */
export const cardBase = cardSurfaceBase
export const cardInteractive = cn(cardSurfaceBase, cardSurfaceTransition, cardSurfaceHover)
export const cardDashed = cardSurfaceDashed
export const cardIconWrap = cardIconTile
export const cardBadge = cardMetaChip

export function cardShellInteractive(opts?: { accent?: boolean; className?: string }) {
  return cn(
    cardSurfaceBase,
    cardSurfaceTransition,
    opts?.accent ? cardSurfaceHoverAccent : cardSurfaceHover,
    opts?.className,
  )
}
