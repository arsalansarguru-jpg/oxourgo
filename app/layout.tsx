import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'

import { AppProviders } from '@/components/providers/app-providers'

import './globals.css'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0a0a0c',
}

export const metadata: Metadata = {
  title: {
    default: 'Oxour Go — Luxury Self-Drive Mumbai',
    template: '%s | Oxour Go',
  },
  description:
    'Premium self-drive luxury car rentals in Mumbai. Verified vehicles, transparent pricing, and 24x7 support.',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  )
}
