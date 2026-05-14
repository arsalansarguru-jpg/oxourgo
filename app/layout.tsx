import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import Script from 'next/script'

import { AppProviders } from '@/components/providers/app-providers'
import { OrganizationAndLocalBusinessJsonLd } from '@/components/seo/organization-json-ld'
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
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
    apple: '/favicon.svg',
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: siteUrl,
    siteName: 'Oxour Go',
    title: 'Oxour Go — Luxury Self-Drive Mumbai',
    description:
      'Premium self-drive luxury car rentals in Mumbai. Verified vehicles, transparent pricing, and 24x7 support.',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Oxour Go — Luxury Self-Drive Mumbai' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Oxour Go — Luxury Self-Drive Mumbai',
    description:
      'Premium self-drive luxury car rentals in Mumbai. Verified vehicles, transparent pricing, and 24x7 support.',
    images: ['/opengraph-image'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 },
  },
  category: 'travel',
}

const themeBootstrapScript = `(function(){try{var k='oxour-theme',d=document.documentElement,s=localStorage.getItem(k);function a(t){d.setAttribute('data-theme',t);}if(s==='light'||s==='dark'){a(s);return;}a(window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark');}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning data-theme="dark">
      <body className="min-w-0 overflow-x-clip font-sans antialiased" suppressHydrationWarning>
        <Script id="oxour-theme-init" strategy="beforeInteractive">
          {themeBootstrapScript}
        </Script>
        <OrganizationAndLocalBusinessJsonLd />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  )
}
