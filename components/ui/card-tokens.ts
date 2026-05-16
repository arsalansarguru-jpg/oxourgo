import { cn } from '@/lib/utils/cn'

/**
 * Shared card shell — border, glass fill, radius, shadow, blur.
 * Uses theme tokens (`stroke`, `fill-glass`) so light mode keeps contrast.
 * Use `group/card` on the root for chip / meta hover sync.
 */
export const cardSurfaceBase =
  'rounded-[1.125rem] border border-stroke bg-carbon/[0.88] shadow-[0_1px_0_0_color-mix(in_srgb,var(--color-stroke)_50%,transparent)_inset,var(--shadow-card)] sm:rounded-2xl'

export const cardSurfaceTransition =
  'transition-[border-color,box-shadow,background-color] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]'

/** Default hover — neutral lift */
export const cardSurfaceHover =
  'hover:border-stroke-strong hover:shadow-[0_1px_0_0_color-mix(in_srgb,var(--color-stroke)_60%,transparent)_inset,var(--shadow-card-hover)]'

/** Product / fleet cards — subtle accent edge on hover (no glow) */
export const cardSurfaceHoverAccent =
  'hover:border-white/[0.12] hover:shadow-[0_1px_0_0_color-mix(in_srgb,var(--color-stroke)_55%,transparent)_inset,var(--shadow-card-hover)]'

/** Gradient glass variant (feature / marketing highlights) */
export const cardSurfaceGlass =
  'rounded-[1.125rem] border border-stroke bg-gradient-to-br from-fill-glass-strong/75 via-fill-glass/40 to-transparent shadow-[0_1px_0_0_color-mix(in_srgb,var(--color-stroke)_45%,transparent)_inset,var(--shadow-card)] backdrop-blur-[10px] sm:rounded-2xl'

export const cardSurfaceGlassHover =
  'hover:border-stroke-strong hover:shadow-[0_1px_0_0_color-mix(in_srgb,var(--color-stroke)_60%,transparent)_inset,var(--shadow-card-hover)]'

/** Dashed outline (upload, empty states) */
export const cardSurfaceDashed =
  'rounded-[1.125rem] border border-dashed border-stroke-strong bg-carbon/[0.4] shadow-[0_1px_0_0_color-mix(in_srgb,var(--color-stroke)_35%,transparent)_inset] transition-[border-color,background-color,box-shadow] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] sm:rounded-2xl'

export const cardPadding = 'p-5 sm:p-6'
export const cardPaddingCompact = 'p-4 sm:p-5'
/** Slightly roomier marketing / feature tiles */
export const cardPaddingFeature = 'p-5 sm:p-6 md:p-7'

export const cardTitle = 'text-[1.0625rem] font-semibold tracking-[-0.02em] text-soft sm:text-lg'
export const cardBody = 'text-sm leading-[1.65] text-muted'
export const cardEyebrow = 'text-[11px] font-medium uppercase tracking-[0.12em] text-muted'

export const cardIconTile =
  'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-stroke-strong bg-fill-glass-strong text-silver transition-[border-color,background-color] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]'

export const cardMetaChip =
  'inline-flex items-center gap-1 rounded-md border border-stroke bg-fill-glass px-2 py-1.5 text-[11px] font-medium tracking-[-0.01em] text-muted transition-colors duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/card:bg-fill-glass-strong sm:text-xs'

export function cardShellInteractive(opts?: { accent?: boolean; className?: string }) {
  return cn(
    cardSurfaceBase,
    cardSurfaceTransition,
    opts?.accent ? cardSurfaceHoverAccent : cardSurfaceHover,
    opts?.className,
  )
}
