'use client'

import Image from 'next/image'
import Link from 'next/link'

import { useSupabaseAuthUser } from '@/hooks/use-supabase-auth-user'
import { WhatsAppInquiryButton } from '@/components/marketing/whatsapp-inquiry-button'
import { BookingSearchBar } from '@/components/marketing/booking-search-bar'
import { Button } from '@/components/ui/Button'

export function HeroSection() {
  const { user, ready } = useSupabaseAuthUser()

  return (
    <section className="relative isolate min-h-[calc(100svh-var(--public-header-offset))] overflow-hidden border-b border-stroke bg-[#080706] text-white">
      <Image
        src="/media/luxury-car-hero.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="absolute inset-0 -z-20 h-full w-full object-cover object-center"
      />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(6,5,4,0.96)_0%,rgba(6,5,4,0.8)_36%,rgba(6,5,4,0.32)_72%,rgba(6,5,4,0.58)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-56 bg-[linear-gradient(180deg,transparent,#080706)]" />

      <div className="container-app flex min-h-[calc(100svh-var(--public-header-offset))] flex-col justify-center py-10 sm:py-12 lg:py-16">
        <div className="max-w-3xl">
          <p className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase text-[#e6c17d] backdrop-blur">
            Self-drive luxury car rental in Mumbai
          </p>
          <h1 className="text-hero-display mt-6 max-w-2xl text-white">
            Drive the city like it belongs to you.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-8 text-white/72 sm:text-lg">
            Premium verified cars, transparent daily rates, and concierge support from inquiry to handover.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button size="lg" to="/fleet" className="w-full sm:w-auto">
              Explore fleet
            </Button>
            <WhatsAppInquiryButton size="lg" label="Concierge on WhatsApp" className="w-full sm:w-auto" />
            {ready ? (
              <Button size="lg" variant="secondary" to={user ? '/dashboard' : '/login'} className="w-full sm:w-auto">
                {user ? 'Open dashboard' : 'Member sign in'}
              </Button>
            ) : null}
          </div>
        </div>

        <div className="mt-10 max-w-5xl">
          <BookingSearchBar />
        </div>

        <p className="mt-6 text-sm text-white/62">
          Need a curated recommendation?{' '}
          <Link href="/support" className="font-semibold text-[#e6c17d] hover:underline">
            Contact support
          </Link>
        </p>
      </div>
    </section>
  )
}
