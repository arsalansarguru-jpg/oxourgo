'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { WhatsAppInquiryButton } from '@/components/marketing/whatsapp-inquiry-button'
import { useSupabaseAuthUser } from '@/hooks/use-supabase-auth-user'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/Button'
import { BookingSearchBar } from '@/components/marketing/booking-search-bar'

const ease = [0.22, 1, 0.36, 1] as const

export function HeroSection() {
  const reduceMotion = useReducedMotion()
  const { user, ready } = useSupabaseAuthUser()
  const t = (duration: number, delay = 0) =>
    reduceMotion ? { duration: 0, delay: 0 } : { duration, delay, ease }

  return (
    <section className="relative bg-matte">
      <div
        className={cn(
          'relative container-app pt-12 pb-16 sm:pt-16 sm:pb-20 lg:pt-20 lg:pb-24 xl:pt-24 xl:pb-28',
          '2xl:max-w-[var(--container-wide)]',
        )}
      >
        <div className="grid min-w-0 grid-cols-1 items-start gap-14 lg:grid-cols-12 lg:gap-x-0 lg:gap-y-16 xl:gap-y-20">
          {/* Editorial copy — narrow measure, left-weighted */}
          <div className="min-w-0 lg:col-span-5 lg:row-span-1 xl:col-span-4 xl:pt-4">
            <motion.p
              initial={{ opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={t(0.45)}
              className="max-w-[14rem] text-[11px] font-medium uppercase leading-relaxed tracking-[0.28em] text-muted"
            >
              Mumbai · Self-drive mobility
            </motion.p>

            <motion.h1
              initial={{ opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={t(0.55, 0.04)}
              className="mt-8 max-w-[min(100%,20rem)] text-[2.125rem] font-medium leading-[1.08] tracking-[-0.045em] text-soft sm:max-w-none sm:text-[2.75rem] sm:leading-[1.06] lg:text-[clamp(2.75rem,4.2vw,3.75rem)] lg:leading-[1.04]"
            >
              Quiet
              <span className="mt-1 block text-muted lg:mt-2">cars for busy</span>
              <span className="mt-1 block text-soft lg:mt-2">itineraries.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={t(0.45, 0.1)}
              className="mt-10 max-w-md text-pretty text-[0.9375rem] font-normal leading-[1.75] text-muted sm:text-base sm:leading-[1.72]"
            >
              A curated fleet of verified vehicles, clear daily rates, and a concierge on WhatsApp who holds
              the handoff from enquiry to keys — built for guests who expect restraint, not noise.
            </motion.p>

            <motion.p
              initial={{ opacity: reduceMotion ? 1 : 0 }}
              animate={{ opacity: 1 }}
              transition={t(0.4, 0.14)}
              className="mt-8 max-w-md text-[13px] leading-relaxed text-silver/90"
            >
              Verified fleet · Transparent pricing · 24×7 support
            </motion.p>

            <motion.div
              initial={{ opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={t(0.45, 0.18)}
              className="mt-12 flex min-w-0 flex-col gap-8 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-12 sm:gap-y-6"
            >
              <WhatsAppInquiryButton
                size="lg"
                variant="ghost"
                showIcon={false}
                className={cn(
                  'h-auto min-h-0 w-full justify-start rounded-none border-0 bg-transparent px-0 py-0 text-left shadow-none sm:w-auto',
                  'text-[13px] font-medium uppercase tracking-[0.18em] text-soft',
                  'hover:bg-transparent hover:opacity-60',
                  'focus-visible:ring-0 focus-visible:ring-offset-0',
                )}
                label="WhatsApp concierge"
              >
                <span className="flex items-center gap-3">
                  <span className="flex flex-col items-start gap-1.5">
                    <span className="flex items-center gap-2">
                      Concierge
                      <ArrowUpRight className="h-4 w-4 opacity-60" strokeWidth={2} aria-hidden />
                    </span>
                    <span className="text-[11px] font-normal normal-case tracking-[0.06em] text-muted">
                      WhatsApp — reserve &amp; brief in one thread
                    </span>
                  </span>
                </span>
              </WhatsAppInquiryButton>

              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-10">
                {ready ? (
                  <Button
                    variant="ghost"
                    size="lg"
                    to={user ? '/dashboard' : '/login'}
                    className="h-auto min-h-0 rounded-none border-0 bg-transparent px-0 py-0 text-[13px] font-medium text-muted shadow-none hover:bg-transparent hover:text-soft"
                  >
                    <span className="flex items-center gap-2">
                      {user ? 'Your dashboard' : 'Sign in'}
                      <ArrowRight className="h-4 w-4 opacity-50" strokeWidth={2} aria-hidden />
                    </span>
                  </Button>
                ) : null}
                <Link
                  href="/fleet"
                  className="inline-flex items-center gap-2 text-[13px] font-medium text-muted transition-colors hover:text-soft"
                >
                  Browse the fleet
                  <ArrowRight className="h-4 w-4 opacity-50" strokeWidth={2} aria-hidden />
                </Link>
              </div>
            </motion.div>
          </div>

          {/* Cinematic image — bleeds right on large screens, no card frame */}
          <motion.div
            initial={{ opacity: reduceMotion ? 1 : 0 }}
            animate={{ opacity: 1 }}
            transition={t(0.65, 0.06)}
            className="relative min-w-0 lg:col-span-7 lg:col-start-6 xl:col-span-8 xl:col-start-5"
          >
            <div
              className={cn(
                'relative w-full overflow-hidden bg-carbon-deep',
                'aspect-[4/5] sm:aspect-[5/6] lg:aspect-auto lg:min-h-[min(72vh,44rem)]',
                'rounded-sm lg:rounded-tl-sm lg:rounded-br-[2rem] xl:rounded-br-[2.5rem]',
              )}
            >
              <Image
                src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1600&q=80"
                alt="Luxury performance vehicle on a night drive"
                fill
                className="object-cover object-[center_42%]"
                sizes="(max-width:1024px) 100vw,55vw"
                priority
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-matte/85 via-transparent to-matte/20 lg:from-matte/50" />
              <p className="pointer-events-none absolute bottom-6 left-5 max-w-[12rem] text-[10px] font-medium uppercase leading-relaxed tracking-[0.24em] text-soft/80 sm:bottom-8 sm:left-8 lg:left-10">
                Inspection-ready · Tariff disclosed before hold
              </p>
            </div>
          </motion.div>
        </div>

        {/* Planner — separated by space, not a card rail */}
        <motion.div
          initial={{ opacity: reduceMotion ? 1 : 0 }}
          animate={{ opacity: 1 }}
          transition={t(0.5, 0.22)}
          className="mt-20 max-w-4xl lg:mt-28 xl:mt-32"
        >
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted">Dates &amp; pickup</p>
          <div className="mt-6">
            <BookingSearchBar />
          </div>
        </motion.div>
      </div>
    </section>
  )
}
