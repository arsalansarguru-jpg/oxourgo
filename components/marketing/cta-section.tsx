import { MessageCircle, Phone } from 'lucide-react'
import { BRAND } from '@/constants/brand'
import { Button } from '@/components/ui/Button'
import { Section } from '@/components/ui/Section'

export function CTASection() {
  return (
    <Section className="py-[clamp(3.25rem,7vw,5.5rem)]">
      <div className="relative overflow-hidden rounded-[1.375rem] border border-stroke bg-carbon px-6 py-12 shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset] sm:rounded-3xl sm:px-10 sm:py-14 md:py-16">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-fill-glass/30 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-2xl px-2 text-center sm:px-0">
          <h2 className="text-section-title text-balance text-soft">Ready to Experience Luxury?</h2>
          <p className="mt-4 text-pretty text-base leading-[1.65] text-muted md:text-lg">
            Message our concierge on WhatsApp to reserve your premium self-drive in Mumbai
          </p>
          <div className="mx-auto mt-9 flex max-w-lg flex-col items-stretch justify-center gap-3.5 sm:max-w-none sm:flex-row sm:flex-wrap sm:items-center sm:justify-center">
            <Button size="lg" to="/fleet" className="w-full sm:w-auto">
              Browse Fleet
            </Button>
            <Button
              size="lg"
              variant="secondary"
              href={BRAND.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full min-h-[3.25rem] sm:w-auto sm:min-h-[3.125rem]"
            >
              <MessageCircle className="h-4 w-4" />
              Book on WhatsApp
            </Button>
            <Button
              size="lg"
              variant="secondary"
              href={`tel:${BRAND.phoneTel}`}
              className="w-full sm:w-auto"
            >
              <Phone className="h-4 w-4" />
              Call Us Now
            </Button>
          </div>
        </div>
      </div>
    </Section>
  )
}
