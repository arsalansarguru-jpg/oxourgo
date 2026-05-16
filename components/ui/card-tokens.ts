import { cn } from '@/lib/utils/cn'

/** Standard product card surface */
export const cardSurfaceBase =
  'rounded-lg border border-stroke bg-carbon shadow-[var(--shadow-card)]'

export const cardSurfaceTransition = 'transition-[box-shadow,border-color] duration-150'

export const cardSurfaceHover = 'hover:border-stroke-strong hover:shadow-[var(--shadow-card-hover)]'

export const cardSurfaceHoverAccent = cardSurfaceHover

export const cardSurfaceGlass = cardSurfaceBase

export const cardSurfaceGlassHover = cardSurfaceHover

export const cardSurfaceDashed =
  'rounded-lg border border-dashed border-stroke-strong bg-carbon transition-colors duration-150'

export const cardPadding = 'p-5 sm:p-6'
export const cardPaddingCompact = 'p-4 sm:p-5'
export const cardPaddingFeature = cardPadding

export const cardTitle = 'font-display text-base font-semibold tracking-tight text-soft'
export const cardBody = 'text-sm leading-relaxed text-muted'
export const cardEyebrow = 'text-xs font-medium text-muted'

export const cardIconTile =
  'flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-stroke bg-carbon-deep text-silver'

export const cardMetaChip =
  'inline-flex items-center gap-1.5 rounded-md bg-carbon-deep px-2.5 py-1 text-xs font-medium text-muted'

export function cardShellInteractive(opts?: { accent?: boolean; className?: string }) {
  return cn(
    cardSurfaceBase,
    cardSurfaceTransition,
    opts?.accent ? cardSurfaceHoverAccent : cardSurfaceHover,
    opts?.className,
  )
}
