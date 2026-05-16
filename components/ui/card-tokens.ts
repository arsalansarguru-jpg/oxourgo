import { cn } from '@/lib/utils/cn'

/** Single card surface — use everywhere for consistency */
export const cardSurfaceBase =
  'rounded-xl border border-stroke bg-carbon'

export const cardSurfaceTransition = 'transition-colors duration-200'

export const cardSurfaceHover = 'hover:border-stroke-strong'

export const cardSurfaceHoverAccent = cardSurfaceHover

export const cardSurfaceGlass = cardSurfaceBase

export const cardSurfaceGlassHover = cardSurfaceHover

export const cardSurfaceDashed =
  'rounded-xl border border-dashed border-stroke-strong bg-carbon/50 transition-colors duration-200'

export const cardPadding = 'p-5 sm:p-6'
export const cardPaddingCompact = 'p-4 sm:p-5'
export const cardPaddingFeature = cardPadding

export const cardTitle = 'text-base font-semibold tracking-tight text-soft sm:text-lg'
export const cardBody = 'text-sm leading-relaxed text-muted'
export const cardEyebrow = 'text-xs font-medium uppercase tracking-wider text-muted'

export const cardIconTile =
  'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-stroke bg-fill-glass text-silver'

export const cardMetaChip =
  'inline-flex items-center gap-1.5 rounded-md bg-fill-glass px-2.5 py-1 text-xs font-medium text-muted'

export function cardShellInteractive(opts?: { accent?: boolean; className?: string }) {
  return cn(
    cardSurfaceBase,
    cardSurfaceTransition,
    opts?.accent ? cardSurfaceHoverAccent : cardSurfaceHover,
    opts?.className,
  )
}
