import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import Script from 'next/script'

import { AppProviders } from '@/components/providers/app-providers'
import { getMetadataSiteUrl } from '@/lib/seo/site-metadata'

import './globals.css'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f3f5fb' },
    { color: '#0a0a0c' },
  ],
}

const siteUrl = getMetadataSiteUrl()

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Oxour Go — Luxury Self-Drive Mumbai',
    template: '%s | Oxour Go',
  },
  description:
    'Premium self-drive luxury car rentals in Mumbai. Verified vehicles, transparent pricing, and 24x7 support.',
  applicationName: 'Oxour Go',
  keywords: ['luxury car rental', 'self drive Mumbai', 'Oxour Go', 'premium fleet', 'car hire'],
  authors: [{ name: 'Oxour Go' }],
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: siteUrl,
    siteName: 'Oxour Go',
    title: 'Oxour Go — Luxury Self-Drive Mumbai',
    description:
      'Premium self-drive luxury car rentals in Mumbai. Verified vehicles, transparent pricing, and 24x7 support.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Oxour Go — Luxury Self-Drive Mumbai',
    description:
      'Premium self-drive luxury car rentals in Mumbai. Verified vehicles, transparent pricing, and 24x7 support.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

const themeBootstrapScript = `(function(){try{var k='oxour-theme',d=document.documentElement,s=localStorage.getItem(k);function a(t){d.setAttribute('data-theme',t);}if(s==='light'||s==='dark'){a(s);return;}a(window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark');}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning data-theme="dark">
      <body className="font-sans antialiased" suppressHydrationWarning>
        <Script id="oxour-theme-init" strategy="beforeInteractive">
          {themeBootstrapScript}
        </Script>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  )
}
