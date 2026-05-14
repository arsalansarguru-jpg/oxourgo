import { CarFront, Search, Sparkles } from 'lucide-react'

import { BRAND } from '@/constants/brand'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils/cn'

type Props = {
  onClear: () => void
  className?: string
}

export function EmptyFleet({ onClear, className }: Props) {
  return (
    <div
      className={cn(
        'relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-stroke bg-gradient-to-b from-matte/[0.72] via-carbon/40 to-matte/[0.55] px-6 py-16 text-center shadow-[var(--shadow-card)] backdrop-blur-xl',
        className,
      )}
    >
      <div
        className="pointer-events-none absolute -left-16 top-0 h-48 w-48 rounded-full bg-electric/14 blur-[72px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-10 bottom-0 h-40 w-40 rounded-full bg-hero-mist blur-[56px]"
        aria-hidden
      />

      <div className="relative flex flex-col items-center">
        <div className="relative flex h-20 w-20 items-center justify-center">
          <span className="absolute inset-0 rounded-2xl border border-electric/25 bg-electric/[0.08] shadow-[0_0_40px_-12px_rgba(59,130,246,0.45)]" />
          <CarFront className="relative h-9 w-9 text-electric/95" aria-hidden />
          <Sparkles className="absolute -right-1 -top-1 h-5 w-5 text-electric/80" aria-hidden />
          <Search className="absolute -bottom-0.5 -left-0.5 h-4 w-4 text-silver/80" aria-hidden />
        </div>

        <div className="relative mt-8 max-w-md space-y-3">
          <p className="text-lg font-semibold tracking-[-0.02em] text-soft sm:text-xl">No vehicles match your search</p>
          <p className="text-sm leading-relaxed text-muted">
            Refine filters or let our concierge curate a match for your itinerary — we reply on WhatsApp within minutes
            during service hours.
          </p>
        </div>

        <div className="relative mt-8 flex w-full max-w-sm flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
          <Button type="button" variant="secondary" className="w-full min-h-12 sm:w-auto sm:min-w-[10rem]" onClick={onClear}>
            Clear filters
          </Button>
          <Button
            href={BRAND.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full min-h-12 sm:w-auto sm:min-w-[10rem]"
          >
            Contact concierge
          </Button>
        </div>
      </div>
    </div>
  )
}
