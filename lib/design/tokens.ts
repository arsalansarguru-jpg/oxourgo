/**
 * Oxour Go — centralized design tokens (BLACK + ELECTRIC BLUE luxury automotive SaaS).
 * CSS variables are defined in `app/globals.css`; use these for TS/JS references and docs.
 */

export const palette = {
  dark: {
    void: '#050816',
    midnight: '#0B1220',
    slate: '#111827',
    electric: '#0066FF',
    cyan: '#00C2FF',
    text: '#FFFFFF',
    textSecondary: '#CBD5E1',
    textMuted: '#94A3B8',
  },
  light: {
    canvas: '#F5F9FF',
    surface: '#EAF2FF',
    surfaceAlt: '#DCEBFF',
    electric: '#0066FF',
    electricDeep: '#004FCC',
    text: '#111827',
    textSecondary: '#334155',
    textMuted: '#475569',
  },
  semantic: {
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    critical: '#DC2626',
  },
} as const

/** Mirrors `app/globals.css` — actual family loaded via `lib/fonts.ts` + `--font-urbanist` */
export const fontFamily = {
  sans: 'var(--font-urbanist), ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  display:
    'var(--font-urbanist), ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
} as const

/** Recommended weights: 400 body, 500 UI chrome, 600 titles, 700 hero/page */
export const fontWeight = {
  body: 400,
  ui: 500,
  title: 600,
  display: 700,
} as const

export const motion = {
  easePremium: 'cubic-bezier(0.22, 1, 0.36, 1)',
  durationFast: '150ms',
  durationNormal: '220ms',
  durationSlow: '360ms',
} as const
