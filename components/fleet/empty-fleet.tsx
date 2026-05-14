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
        'flex flex-col items-center justify-center gap-4 rounded-2xl border border-stroke bg-matte/[0.55] px-6 py-16 text-center shadow-[var(--shadow-card)] backdrop-blur-xl',
        className,
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-stroke bg-fill-glass-strong">
        <Search className="h-7 w-7 text-muted" aria-hidden />
      </div>
      <div className="max-w-md space-y-2">
        <p className="text-lg font-semibold text-soft">No vehicles match your search</p>
        <p className="text-sm leading-relaxed text-muted">
          Try different keywords, clear filters, or reach our concierge on WhatsApp for a bespoke match.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button type="button" variant="secondary" onClick={onClear}>
          Clear search
        </Button>
        <Button href={BRAND.whatsapp} target="_blank" rel="noreferrer">
          Contact concierge
        </Button>
      </div>
    </div>
  )
}
