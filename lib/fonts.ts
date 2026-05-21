import { Urbanist } from 'next/font/google'

/**
 * Single production font loader for Oxour Go (client + admin).
 * Applied via `variable` on `<html>` and `className` on `<body>` in `app/layout.tsx`.
 */
export const urbanist = Urbanist({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-urbanist',
  preload: true,
  adjustFontFallback: true,
})

/** Sans fallback stack when CSS variables are unavailable */
export const FONT_FALLBACK =
  'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' as const
