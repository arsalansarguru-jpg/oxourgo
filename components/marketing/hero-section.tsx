'use client'

import Image from 'next/image'
import Link from 'next/link'

import { useResolvedAppRole } from '@/hooks/use-resolved-app-role'
import { defaultPostLoginPath } from '@/lib/auth/post-login-path'
import { marketingHeroSection } from '@/lib/design/ui-system'
import { WhatsAppInquiryButton } from '@/components/marketing/whatsapp-inquiry-button'
import { BookingSearchBar } from '@/components/marketing/booking-search-bar'
import { Button } from '@/components/ui/Button'

/** Cinematic black + electric blue hero — local asset for fast LCP. */
const HERO_IMAGE_SRC = '/media/luxury-car-hero-electric.png'

export function HeroSection() {
  const { user, ready, appRole, isStaff } = useResolvedAppRole()
  const memberHref = user ? defaultPostLoginPath(appRole) : '/login'
  const memberLabel = user ? (isStaff ? 'Admin console' : 'Open dashboard') : 'Member sign in'

  return (
    <section className={marketingHeroSection}>
      <Image
        src={HERO_IMAGE_SRC}
        alt="Black luxury sedan on a wet city street at night with electric blue lighting"
        fill
        priority
        quality={85}
        sizes="100vw"
        className="absolute inset-0 -z-20 h-full w-full object-cover object-[76%_52%] brightness-[0.7] contrast-[1.14] saturate-[0.9] sm:object-[70%_50%] lg:object-[62%_48%]"
      />
      <div
        className="pointer-events-none absolute inset-0 -z-[19] backdrop-blur-[1px] [mask-image:linear-gradient(90deg,black_0%,black_28%,transparent_62%)]"
        aria-hidden
      />
      <div
        className="absolute inset-0 -z-10 bg-[var(--hero-overlay-left)]"
        aria-hidden
      />
      <div
        className="absolute inset-0 -z-10 bg-[var(--hero-overlay)]"
        aria-hidden
      />
      <div
        className="absolute inset-0 -z-10 bg-[var(--hero-overlay-vignette)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[var(--hero-overlay-blue-glow)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[var(--background-image-hero-mesh)] opacity-80"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-24 top-1/4 -z-10 h-80 w-80 rounded-full bg-electric/20 blur-[120px] animate-glow-pulse"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-0 right-0 -z-10 h-64 w-64 rounded-full bg-cyan/15 blur-[100px]"
        aria-hidden
      />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-56 bg-[var(--background-image-hero-cinematic)]" />

      <div className="container-app flex min-h-[calc(100svh-var(--public-header-offset))] flex-col justify-center py-10 sm:py-12 lg:py-16">
        <div className="max-w-3xl">
          <p className="text-hero-kicker inline-flex rounded-full border border-electric/35 bg-electric/10 px-4 py-2 backdrop-blur-md">
            Self-drive luxury car rental in Mumbai
          </p>
          <h1 className="text-hero-display mt-6 max-w-2xl text-soft">
            Drive the city like it belongs to you.
          </h1>
          <p className="mt-6 max-w-xl text-base font-medium leading-8 text-silver sm:text-lg">
            Premium verified cars, transparent daily rates, and concierge support from inquiry to handover.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button size="lg" to="/fleet" className="w-full sm:w-auto">
              Explore fleet
            </Button>
            <WhatsAppInquiryButton size="lg" label="Concierge on WhatsApp" className="w-full sm:w-auto" />
            {ready ? (
              <Button size="lg" variant="secondary" to={memberHref} className="w-full sm:w-auto">
                {memberLabel}
              </Button>
            ) : null}
          </div>
        </div>

        <div className="mt-10 max-w-5xl">
          <BookingSearchBar />
        </div>

        <p className="mt-6 text-sm font-medium text-silver">
          Need a curated recommendation?{' '}
          <Link href="/support" className="font-semibold text-cyan hover:text-electric hover:underline">
            Contact support
          </Link>
        </p>
      </div>
    </section>
  )
}
