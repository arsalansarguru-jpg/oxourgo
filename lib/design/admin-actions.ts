/**
 * Admin action button semantics — safe / success / warning / danger / critical.
 * Pair with `Button` variant or `cn(adminActionClasses[type], ...)`.
 */
export const adminActionClasses = {
  safe: [
    'border-electric/40 bg-electric/15 text-electric',
    'hover:border-electric/60 hover:bg-electric/25 hover:shadow-[0_0_24px_-6px_var(--glow-electric)]',
    'theme-light:border-electric/35 theme-light:bg-electric/10 theme-light:text-[#004FCC]',
  ].join(' '),
  success: [
    'border-emerald-400/35 bg-emerald-500/15 text-emerald-200',
    'hover:bg-emerald-500/25',
    'theme-light:border-emerald-500/40 theme-light:bg-emerald-50 theme-light:text-emerald-800',
  ].join(' '),
  warning: [
    'border-amber-400/35 bg-amber-500/15 text-amber-100',
    'hover:bg-amber-500/25',
    'theme-light:border-amber-500/40 theme-light:bg-amber-50 theme-light:text-amber-900',
  ].join(' '),
  danger: [
    'border-red-400/40 bg-red-500/15 text-red-200',
    'hover:bg-red-500/25',
    'theme-light:border-red-300 theme-light:bg-red-50 theme-light:text-red-800',
  ].join(' '),
  critical: [
    'border-red-500/60 bg-red-500/20 text-red-100',
    'animate-critical-pulse hover:bg-red-500/30',
    'theme-light:border-red-500 theme-light:bg-red-50 theme-light:text-red-900',
  ].join(' '),
} as const

export type AdminActionTone = keyof typeof adminActionClasses

export const adminKpiGlow = {
  default: 'shadow-[0_0_40px_-12px_var(--glow-electric)]',
  success: 'shadow-[0_0_32px_-10px_rgba(16,185,129,0.45)]',
  warning: 'shadow-[0_0_32px_-10px_rgba(245,158,11,0.4)]',
  critical: 'shadow-[0_0_36px_-8px_rgba(239,68,68,0.55)] animate-critical-pulse',
} as const
