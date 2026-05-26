'use client'

import { useRouter } from 'next/navigation'
import { motion, type Variants } from 'framer-motion'
import { Bot, CarFront, Clock, IndianRupee, RefreshCw, ShieldCheck } from 'lucide-react'
import type { Car } from '@/types/car'
import { Section, SectionHeading } from '@/components/ui/Section'
import { DataLoadErrorPanel } from '@/components/ui/data-load-error'
import { CarCard } from '@/components/fleet/car-card'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { WhatsAppInquiryButton } from '@/components/marketing/whatsapp-inquiry-button'
import { ThreeDTiltWrapper } from '@/components/ui/three-d-tilt-wrapper'

const benefits = [
  { icon: ShieldCheck, label: 'Verified vehicles' },
  { icon: IndianRupee, label: 'Transparent pricing' },
  { icon: Bot, label: '24×7 support' },
  { icon: Clock, label: 'WhatsApp concierge' },
] as const

const ease = [0.22, 1, 0.36, 1] as const

const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.05,
    },
  },
}

const staggerItem: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease,
    },
  },
}

export type HomeBelowFoldProps = {
  featuredCars: Car[]
  featuredLoadFailed?: boolean
}

export function HomeBelowFold({ featuredCars, featuredLoadFailed = false }: HomeBelowFoldProps) {
  const router = useRouter()

  return (
    <>
      <Section>
        <SectionHeading
          title="Featured vehicles"
          subtitle="Popular picks from our Mumbai fleet."
        />
        <motion.div
          className="grid min-w-0 gap-6 sm:grid-cols-2 lg:grid-cols-3"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
        >
          {featuredLoadFailed ? (
            <div className="col-span-full">
              <DataLoadErrorPanel
                title="Unable to load featured fleet"
                description="Please refresh the page or try again shortly."
                onRetry={() => router.refresh()}
                retryLabel={
                  <>
                    <RefreshCw className="h-4 w-4" aria-hidden />
                    Try again
                  </>
                }
              />
            </div>
          ) : featuredCars.length === 0 ? (
            <div className="col-span-full">
              <EmptyState
                icon={CarFront}
                title="Featured fleet"
                description="Browse the full collection while we update featured vehicles."
                actionLabel="Browse fleet"
                to="/fleet"
              />
            </div>
          ) : (
            featuredCars.map((car) => (
              <motion.div key={car.id} variants={staggerItem} className="h-full">
                <ThreeDTiltWrapper maxTilt={8} className="h-full">
                  <CarCard car={car} />
                </ThreeDTiltWrapper>
              </motion.div>
            ))
          )}
        </motion.div>
        <div className="flex justify-center">
          <Button size="lg" variant="secondary" to="/fleet">
            View all vehicles
          </Button>
        </div>
      </Section>

      <Section variant="muted">
        <SectionHeading
          title="Why Oxour Go"
          subtitle="A straightforward self-drive experience."
          align="center"
        />
        <motion.ul
          className="mx-auto grid max-w-3xl gap-3 sm:grid-cols-2 lg:grid-cols-4"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
        >
          {benefits.map(({ icon: Icon, label }) => (
            <motion.li
              key={label}
              variants={staggerItem}
              whileHover={{ scale: 1.03, y: -2 }}
              transition={{ type: 'spring', stiffness: 350, damping: 20 }}
              className="flex items-center gap-3 rounded-lg border border-stroke bg-carbon px-4 py-3.5 shadow-[var(--shadow-card)] transition-all duration-300 hover:border-electric/30 hover:shadow-[0_0_20px_rgba(0,102,255,0.12)]"
            >
              <Icon className="h-4 w-4 shrink-0 text-electric" aria-hidden />
              <span className="text-sm font-medium text-soft">{label}</span>
            </motion.li>
          ))}
        </motion.ul>
      </Section>

      <Section>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.65, ease }}
          className="mx-auto flex max-w-xl flex-col items-center gap-5 text-center p-8 rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.04] to-transparent shadow-[var(--shadow-card)]"
        >
          <h2 className="text-section-title text-soft">Ready to book?</h2>
          <p className="text-base leading-relaxed text-muted">
            Message us on WhatsApp with your dates and vehicle preference. We confirm availability before you commit.
          </p>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <WhatsAppInquiryButton size="lg" label="WhatsApp us" className="w-full sm:w-auto hover:shadow-[0_0_20px_rgba(0,102,255,0.3)] transition-shadow duration-300" />
            <Button size="lg" variant="secondary" to="/fleet" className="w-full sm:w-auto">
              Browse fleet
            </Button>
          </div>
        </motion.div>
      </Section>
    </>
  )
}
