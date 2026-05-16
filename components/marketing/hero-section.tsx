'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useSupabaseAuthUser } from '@/hooks/use-supabase-auth-user'
import { WhatsAppInquiryButton } from '@/components/marketing/whatsapp-inquiry-button'
import { Button } from '@/components/ui/Button'
import { BookingSearchBar } from '@/components/marketing/booking-search-bar'

export function HeroSection() {
  const { user, ready } = useSupabaseAuthUser()

  return (
    <section className="border-b border-stroke bg-matte">
      <div className="container-app py-12 sm:py-16 lg:py-20">
        <div className="grid min-w-0 gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
          <div className="flex min-w-0 flex-col gap-6">
            <p className="text-xs font-medium uppercase tracking-wider text-muted">Luxury self-drive · Mumbai</p>
            <h1 className="text-hero-display max-w-xl text-soft">
              Premium cars. Clear pricing. Concierge on WhatsApp.
            </h1>
            <p className="max-w-lg text-base leading-relaxed text-muted">
              Browse a verified fleet, choose your dates, and reserve with our team — transparent daily rates and
              24×7 support for business and leisure travel.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <WhatsAppInquiryButton size="lg" label="Book on WhatsApp" />
              <Button size="lg" variant="secondary" to="/fleet">
                Browse fleet
              </Button>
              {ready ? (
                <Button size="lg" variant="ghost" to={user ? '/dashboard' : '/login'}>
                  {user ? 'Dashboard' : 'Sign in'}
                </Button>
              ) : null}
            </div>
            <p className="text-sm text-muted">
              <Link href="/fleet" className="font-medium text-soft underline-offset-4 hover:underline">
                View all vehicles
              </Link>
            </p>
          </div>

          <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-stroke bg-carbon-deep lg:aspect-[5/4]">
            <Image
              src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1600&q=80"
              alt="Luxury vehicle"
              fill
              className="object-cover"
              sizes="(max-width:1024px) 100vw,50vw"
              priority
            />
          </div>
        </div>

        <div className="mt-12 border-t border-stroke pt-10 lg:mt-14 lg:pt-12">
          <p className="mb-4 text-xs font-medium uppercase tracking-wider text-muted">Plan your trip</p>
          <BookingSearchBar />
        </div>
      </div>
    </section>
  )
}
