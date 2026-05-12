import type { Metadata, Viewport } from 'next'

import { AppProviders } from '@/components/providers/app-providers'
import { readSupabasePublicEnv } from '@/lib/env/supabase-public'

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const supabasePublic = readSupabasePublicEnv()

  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased">
        <AppProviders
          supabaseUrl={supabasePublic?.url ?? null}
          supabaseAnonKey={supabasePublic?.anonKey ?? null}
        >
          {children}
        </AppProviders>
      </body>
    </html>
  )
}
