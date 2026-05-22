'use client'

import { motion } from 'framer-motion'
import { Headphones, LifeBuoy, MessageCircle, Mic, Phone, ShieldAlert } from 'lucide-react'
import { SupportChatPanel } from '@/features/support/support-chat-panel'
import type { SupportMessageRow } from '@/lib/support/types'
import { BRAND } from '@/constants/brand'
import { supportFaqs } from '@/data/faqs'
import { Section, SectionHeading } from '@/components/ui/Section'
import { SupportCard } from '@/components/support/support-card'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import {
  cardPadding,
  cardSurfaceBase,
  cardSurfaceGlass,
  cardSurfaceGlassHover,
  cardSurfaceHover,
  cardSurfaceTransition,
} from '@/components/ui/card-tokens'
import { cn } from '@/lib/utils/cn'

const categories = [
  {
    title: 'Booking & extensions',
    body: 'Modify pickup windows, add chauffeur notes, or coordinate airport handoffs.',
  },
  {
    title: 'Billing & deposits',
    body: 'Pre-auth timelines, GST invoices, and corporate billing contacts.',
  },
  {
    title: 'Vehicle condition',
    body: 'Inspection photos, cosmetic wear guidelines, and workshop escalations.',
  },
  {
    title: 'Roadside & safety',
    body: 'Flat tires, fuel assistance, and 24x7 emergency routing.',
  },
] as const

type SupportViewProps = {
  greetingName?: string | null
  initialMessages?: SupportMessageRow[]
  signedIn?: boolean
}

export function SupportView({ greetingName, initialMessages = [], signedIn = false }: SupportViewProps) {
  const greet = greetingName?.trim() ? greetingName.trim() : 'there'

  return (
    <>
      <Section className="pt-8">
        <SectionHeading
          eyebrow="Support"
          title="We respond in minutes, not days"
          subtitle="Premium mobility deserves premium care—AI triage with human escalation in Mumbai."
        />

        <div className="grid min-w-0 gap-6 lg:grid-cols-3">
          <Card className={cn('lg:col-span-2', cardSurfaceHover)}>
            <CardContent>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-electric">
                    AI assistant
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-soft">Oxour concierge</h2>
                </div>
                <span className="rounded-full border border-emerald/30 bg-emerald/10 px-2.5 py-1 text-xs font-medium text-emerald">
                  Online
                </span>
              </div>

              <SupportChatPanel
                greetingName={greet}
                initialMessages={initialMessages}
                signedIn={signedIn}
              />
            </CardContent>
          </Card>

          <div className="space-y-4">
            <SupportCard
              icon={MessageCircle}
              title="WhatsApp priority lane"
              description="Verified guests jump the queue. Average first response under 4 minutes."
              action={
                <Button className="w-full" href={BRAND.whatsapp} target="_blank" rel="noreferrer">
                  Open WhatsApp
                </Button>
              }
            />
            <SupportCard
              icon={ShieldAlert}
              title="Emergency contact"
              description="If you feel unsafe or have a major incident, call our emergency line immediately."
              action={
                <Button variant="danger" className="w-full" href={`tel:${BRAND.phoneTel}`}>
                  <Phone className="h-4 w-4" />
                  Call {BRAND.phoneDisplay}
                </Button>
              }
            />
          </div>
        </div>
      </Section>

      <Section className="bg-carbon-deep/80">
        <div className="grid gap-6 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={cn('p-6', cardSurfaceGlass, cardSurfaceGlassHover, cardSurfaceTransition)}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-electric/25 bg-electric/10 text-electric">
                <Mic className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-soft">Voice support</h3>
                <p className="text-sm text-silver">Tap to connect with a specialist when voice routing is enabled.</p>
              </div>
            </div>
            <div className="mt-6 flex h-24 items-end justify-center gap-1">
              {Array.from({ length: 24 }).map((_, i) => (
                <motion.span
                  key={i}
                  className="w-1 rounded-full bg-electric/70"
                  animate={{ height: [10, 24 + (i % 5) * 4, 10] }}
                  transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.04 }}
                />
              ))}
            </div>
          </motion.div>

          <div>
            <h3 className="text-lg font-semibold text-soft">FAQs</h3>
            <div className="mt-4 space-y-3">
              {supportFaqs.map((f) => (
                <Card key={f.id} className={cn(cardSurfaceHover)}>
                  <CardContent>
                    <p className="font-medium text-soft">{f.question}</p>
                    <p className="mt-2 text-sm leading-relaxed text-silver">{f.answer}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <Section>
        <SectionHeading title="Support categories" subtitle="Choose a lane—we route to the right expert." />
        <div className="grid gap-4 md:grid-cols-2">
          {categories.map((c) => (
            <SupportCard key={c.title} icon={LifeBuoy} title={c.title} description={c.body} />
          ))}
        </div>
        <div className={cn('mt-10', cardSurfaceBase, cardSurfaceTransition, cardPadding, cardSurfaceHover)}>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <Headphones className="mt-1 h-6 w-6 text-electric" />
              <div>
                <h3 className="text-lg font-semibold text-soft">Contact methods</h3>
                <p className="mt-1 text-sm text-silver">
                  Email {BRAND.email} · Phone {BRAND.phoneDisplay} · HQ {BRAND.address}
                </p>
              </div>
            </div>
            <Button href={`mailto:${BRAND.email}`}>Email the desk</Button>
          </div>
        </div>
      </Section>
    </>
  )
}
