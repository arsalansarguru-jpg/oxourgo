'use client'

import Image from 'next/image'
import { motion, useReducedMotion } from 'framer-motion'
import { BadgeCheck, Headphones, MessageCircle, ShieldCheck, Sparkles } from 'lucide-react'
import { staggerContainer } from '@/animations/presets'
import { BRAND } from '@/constants/brand'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/Button'
import { BookingSearchBar } from '@/components/marketing/booking-search-bar'

const ease = [0.22, 1, 0.36, 1] as const

const trustSignals = [
  { icon: ShieldCheck, label: 'Verified fleet' },
  { icon: BadgeCheck, label: 'Transparent pricing' },
  { icon: Headphones, label: '24×7 support' },
] as const

export function HeroSection() {
  const reduceMotion = useReducedMotion()
  const t = (duration: number, delay = 0) =>
    reduceMotion ? { duration: 0, delay: 0 } : { duration, delay, ease }

  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-hero-mesh" />
      <div className="pointer-events-none absolute inset-0 bg-hero-cinematic" />
      <div className="pointer-events-none absolute -right-[22%] top-[-12%] h-[min(520px,62vw)] w-[min(520px,95vw)] rounded-full bg-electric/16 blur-[110px] sm:-right-[14%] sm:top-[-8%] md:right-[-6%]" />
      <div className="pointer-events-none absolute -left-[28%] top-[38%] h-[min(440px,70vw)] w-[min(440px,90vw)] rounded-full bg-white/[0.045] blur-[100px] sm:-left-[18%] sm:top-[28%]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-matte via-matte/40 to-transparent" />

      <div
        className={cn(
          'relative container-app pb-[clamp(2.75rem,6vw,4.5rem)] pt-[clamp(2rem,4.5vw,3.25rem)] sm:pb-16 sm:pt-[clamp(2.5rem,4vw,3.75rem)] lg:pb-[clamp(3.5rem,6vw,5.5rem)] lg:pt-[clamp(2.75rem,4vw,4.25rem)] 2xl:max-w-[var(--container-wide)]',
        )}
      >
        <div className="grid items-center gap-10 sm:gap-11 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-12 lg:gap-x-14 xl:gap-x-16">
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="flex max-w-[36rem] flex-col lg:max-w-none xl:max-w-[40rem]"
          >
            <motion.div
              variants={{
                initial: { opacity: 0, y: reduceMotion ? 0 : 12 },
                animate: { opacity: 1, y: 0 },
              }}
              transition={t(0.48)}
              className="inline-flex w-fit items-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.035] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted shadow-[inset_0_1px_0_0_rgba(255,255,255,0.07)] backdrop-blur-md sm:px-3.5 sm:text-[11px]"
            >
              <Sparkles className="h-3.5 w-3.5 shrink-0 text-electric" aria-hidden />
              Luxury car
            </motion.div>

            <motion.p
              variants={{
                initial: { opacity: 0, y: reduceMotion ? 0 : 14 },
                animate: { opacity: 1, y: 0 },
              }}
              transition={t(0.48, 0.05)}
              className="text-hero-kicker mt-4 max-w-xl text-electric/90 sm:mt-5"
            >
              Premium Self-Drive Experience
            </motion.p>

            <motion.h1
              variants={{
                initial: { opacity: 0, y: reduceMotion ? 0 : 18 },
                animate: { opacity: 1, y: 0 },
              }}
              transition={t(0.58, 0.09)}
              className="text-hero-display mt-3 text-soft sm:mt-4"
            >
              Drive Luxury.
              <span className="mt-1 block sm:mt-2">
                <span className="bg-gradient-to-br from-soft via-[#e4e9f0] to-silver bg-clip-text text-transparent [-webkit-background-clip:text]">
                  Live Premium.
                </span>
              </span>
            </motion.h1>

            <motion.p
              variants={{
                initial: { opacity: 0, y: reduceMotion ? 0 : 14 },
                animate: { opacity: 1, y: 0 },
              }}
              transition={t(0.52, 0.13)}
              className="mt-5 max-w-xl text-pretty text-[0.9375rem] leading-[1.72] text-muted sm:mt-6 sm:text-lg sm:leading-[1.68] lg:text-[1.0625rem] lg:leading-[1.66]"
            >
              Experience Mumbai&apos;s finest self-drive luxury cars. Verified vehicles, transparent pricing,
              and 24x7 support for business travelers, tourists, and premium leisure customers.
            </motion.p>

            <motion.ul
              variants={{
                initial: { opacity: 0, y: reduceMotion ? 0 : 10 },
                animate: { opacity: 1, y: 0 },
              }}
              transition={t(0.45, 0.16)}
              className="mt-6 flex flex-col gap-2.5 sm:mt-7 sm:flex-row sm:flex-wrap sm:gap-x-6 sm:gap-y-2"
              aria-label="Trust signals"
            >
              {trustSignals.map(({ icon: Icon, label }) => (
                <li
                  key={label}
                  className="flex items-center gap-2 text-[12px] font-medium tracking-[-0.01em] text-muted sm:text-[13px]"
                >
                  <Icon className="h-3.5 w-3.5 shrink-0 text-electric/85" aria-hidden />
                  <span className="text-soft/90">{label}</span>
                </li>
              ))}
            </motion.ul>

            <motion.div
              variants={{
                initial: { opacity: 0, y: reduceMotion ? 0 : 12 },
                animate: { opacity: 1, y: 0 },
              }}
              transition={t(0.52, 0.2)}
              className="mt-8 flex min-w-0 flex-col gap-3 sm:mt-9 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3.5"
            >
              <Button
                size="lg"
                to="/fleet"
                className="w-full shadow-[0_20px_56px_-24px_rgba(59,130,246,0.55)] sm:w-auto sm:min-w-[11.5rem]"
              >
                Explore Fleet
              </Button>
              <Button
                size="lg"
                variant="secondary"
                href={BRAND.whatsapp}
                target="_blank"
                rel="noreferrer"
                className="w-full border-white/[0.11] bg-white/[0.055] hover:translate-y-0 active:translate-y-0 sm:w-auto"
              >
                <MessageCircle className="h-4 w-4 shrink-0" />
                WhatsApp Booking
              </Button>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{
              opacity: reduceMotion ? 1 : 0,
              scale: reduceMotion ? 1 : 0.97,
              filter: reduceMotion ? 'blur(0px)' : 'blur(8px)',
            }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.85, delay: 0.06, ease }}
            className="w-full"
          >
            <div
              className={cn(
                'relative mx-auto w-full max-w-lg lg:mx-0 lg:max-w-none',
                'lg:translate-y-0 xl:translate-y-1',
              )}
            >
              <div className="group relative overflow-hidden rounded-[1.125rem] border border-white/[0.085] bg-carbon shadow-[var(--shadow-card),0_0_0_1px_rgba(255,255,255,0.02)_inset] sm:rounded-[1.35rem] lg:rounded-3xl">
                <div className="pointer-events-none absolute -bottom-12 -right-10 z-0 h-[min(200px,42vw)] w-[min(200px,42vw)] rounded-[2rem] border border-electric/18 bg-electric/12 opacity-90 blur-[48px] transition-[opacity,transform] duration-[850ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:opacity-[0.98] group-hover:scale-105 sm:h-44 sm:w-44" />
                <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-br from-matte/75 via-transparent to-electric/[0.06]" />
                <div className="pointer-events-none absolute inset-0 z-[1] bg-[linear-gradient(180deg,rgba(10,10,12,0.15)_0%,transparent_38%,transparent_62%,rgba(10,10,12,0.88)_100%)]" />
                <div className="relative z-[2] aspect-[16/11] w-full max-h-[min(52vh,380px)] bg-carbon-deep sm:max-h-none sm:aspect-[16/10] lg:aspect-[5/4] xl:aspect-[4/3]">
                  <Image
                    src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1600&q=80"
                    alt="Luxury performance vehicle on a cinematic night drive"
                    fill
                    unoptimized
                    className="object-cover object-[center_42%] opacity-[0.93] transition-[transform,opacity,filter] duration-[880ms] ease-[cubic-bezier(0.22,1,0.36,1)] sm:object-center group-hover:scale-[1.028] group-hover:opacity-[0.98] group-hover:brightness-[1.03]"
                    sizes="(max-width:640px) 100vw,(max-width:1024px) 90vw,44vw"
                    priority
                  />
                </div>
                <motion.div
                  initial={{ opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={reduceMotion ? { duration: 0 } : { duration: 0.55, delay: 0.35, ease }}
                  className="absolute bottom-3 left-3 right-3 z-[3] rounded-xl border border-white/[0.085] bg-matte/[0.52] px-3.5 py-3 backdrop-blur-2xl backdrop-saturate-150 sm:bottom-4 sm:left-4 sm:right-4 sm:rounded-2xl sm:px-5 sm:py-4 lg:bottom-5 lg:left-5 lg:right-5"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-electric/90 sm:text-[11px]">
                    Concierge handoff
                  </p>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-soft/95 sm:mt-1.5 sm:text-sm">
                    Verified inspection · Transparent tariff · Instant itinerary sync
                  </p>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.55, delay: 0.28, ease }}
          className="mt-[clamp(2.25rem,5.5vw,3.5rem)] border-t border-white/[0.05] pt-[clamp(1.75rem,4vw,2.75rem)]"
        >
          <BookingSearchBar />
        </motion.div>
      </div>
    </section>
  )
}
