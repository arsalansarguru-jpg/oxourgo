'use client'

import Link from 'next/link'
import { useSupabaseAuthUser } from '@/hooks/use-supabase-auth-user'
import { WhatsAppInquiryButton } from '@/components/marketing/whatsapp-inquiry-button'
import { Button } from '@/components/ui/Button'
import { BookingSearchBar } from '@/components/marketing/booking-search-bar'

export function HeroSection() {
  const { user, ready } = useSupabaseAuthUser()

  return (
    <section className="border-b border-stroke bg-matte">
      <div className="container-app py-14 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-medium text-muted">Self-drive car rental · Mumbai</p>
          <h1 className="text-hero-display mt-4 text-soft">
            Book a car in minutes. Drive with confidence.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted">
            Browse verified vehicles, see clear daily rates, and reserve through our team on WhatsApp — with support
            when you need it.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" to="/fleet">
              Browse fleet
            </Button>
            <WhatsAppInquiryButton size="lg" label="WhatsApp us" />
            {ready ? (
              <Button size="lg" variant="ghost" to={user ? '/dashboard' : '/login'}>
                {user ? 'Dashboard' : 'Sign in'}
              </Button>
            ) : null}
          </div>
        </div>

        <div className="mx-auto mt-12 max-w-4xl">
          <BookingSearchBar />
        </div>

        <p className="mt-6 text-center text-sm text-muted">
          Need help choosing?{' '}
          <Link href="/support" className="font-medium text-soft hover:underline">
            Contact support
          </Link>
        </p>
      </div>
    </section>
  )
}
