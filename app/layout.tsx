import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import Script from 'next/script'

import { AppProviders } from '@/components/providers/app-providers'
import { OrganizationAndLocalBusinessJsonLd } from '@/components/seo/organization-json-ld'
import { getSiteUrl } from '@/lib/env/site-url'
import { urbanist } from '@/lib/fonts'
import { cn } from '@/lib/utils/cn'

import './globals.css'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#050816' },
    { color: '#F5F9FF' },
  ],
}

const siteUrl = getSiteUrl()

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Oxour Go — Self-Drive Car Rental Mumbai',
    template: '%s | Oxour Go',
  },
  description:
    'Self-drive car rentals in Mumbai. Verified vehicles, transparent pricing, and concierge support on WhatsApp.',
  applicationName: 'Oxour Go',
  keywords: ['car rental Mumbai', 'self drive', 'Oxour Go', 'fleet booking', 'car hire'],
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
    title: 'Oxour Go — Self-Drive Car Rental Mumbai',
    description:
      'Self-drive car rentals in Mumbai. Verified vehicles, transparent pricing, and concierge support on WhatsApp.',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Oxour Go — Self-Drive Car Rental Mumbai' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Oxour Go — Self-Drive Car Rental Mumbai',
    description:
      'Self-drive car rentals in Mumbai. Verified vehicles, transparent pricing, and concierge support on WhatsApp.',
    images: ['/opengraph-image'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 },
  },
  category: 'travel',
}

const themeBootstrapScript = `(function(){try{var k='oxour-theme',d=document.documentElement,s=localStorage.getItem(k);function a(t){d.setAttribute('data-theme',t);d.style.colorScheme=t;}if(s==='light'||s==='dark'){a(s);return;}a(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');}catch(e){document.documentElement.setAttribute('data-theme','dark');document.documentElement.style.colorScheme='dark';}})();`

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-theme="dark"
      className={cn(urbanist.variable, 'transition-colors duration-200')}
    >
      <body
        className={cn(
          urbanist.className,
          'min-w-0 overflow-x-clip font-sans font-normal antialiased',
        )}
        suppressHydrationWarning
      >
        <Script id="oxour-theme-init" strategy="beforeInteractive">
          {themeBootstrapScript}
        </Script>
        <OrganizationAndLocalBusinessJsonLd />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  )
}
