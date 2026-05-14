'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Headphones, LifeBuoy, Loader2, MessageCircle, Mic, Phone, ShieldAlert } from 'lucide-react'
import { BRAND } from '@/constants/brand'
import { supportFaqs } from '@/data/faqs'
import { Section, SectionHeading } from '@/components/ui/Section'
import { SupportCard } from '@/components/support/support-card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
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
}

export function SupportView({ greetingName }: SupportViewProps) {
  const [chat, setChat] = useState('')
  const [sentHint, setSentHint] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

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

              <div
                className={cn(
                  'mt-4 space-y-3 p-4',
                  cardSurfaceBase,
                  cardSurfaceTransition,
                  'bg-matte/[0.45]',
                )}
              >
                <div className="max-w-[85%] rounded-2xl rounded-bl-md border border-stroke bg-fill-glass px-3 py-2 text-sm text-muted">
                  Hi {greet} — I can help with bookings, billing, or roadside. What do you need?
                </div>
                <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-md border border-electric/25 bg-electric/10 px-3 py-2 text-sm text-soft">
                  I&apos;d like to extend my BMW booking by one day.
                </div>
                <div className="max-w-[85%] rounded-2xl rounded-bl-md border border-stroke bg-fill-glass px-3 py-2 text-sm text-muted">
                  Checking detailing… You can extend until May 15, 18:00 for ₹8,500 + taxes. Shall I hold
                  it?
                </div>
              </div>

              <div className="mt-4 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-stretch">
                <Input
                  placeholder="Ask anything about your trip…"
                  value={chat}
                  onChange={(e) => setChat(e.target.value)}
                  aria-label="Chat message"
                  className="min-w-0 flex-1"
                />
                <Button
                  type="button"
                  className="w-full shrink-0 sm:w-40"
                  disabled={sending || !chat.trim()}
                  onClick={() => {
                    setSentHint(null)
                    setSending(true)
                    window.setTimeout(() => {
                      setSentHint('Message queued for the concierge team.')
                      setChat('')
                      setSending(false)
                    }, 650)
                  }}
                >
                  {sending ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      Sending…
                    </span>
                  ) : (
                    'Send'
                  )}
                </Button>
              </div>
              {sentHint ? (
                <p className="mt-3 flex items-center gap-2 text-xs font-medium text-emerald">
                  <Check className="h-3.5 w-3.5" aria-hidden />
                  {sentHint}
                </p>
              ) : (
                <p className="mt-2 text-xs text-silver">
                  Messages route to our Mumbai operations desk. For urgent issues, use WhatsApp or the
                  emergency line.
                </p>
              )}
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
