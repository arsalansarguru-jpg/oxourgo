import { formatInr } from '@/lib/format'
import { cn } from '@/lib/utils/cn'
import {
  cardEyebrow,
  cardPadding,
  cardSurfaceBase,
  cardSurfaceTransition,
} from '@/components/ui/card-tokens'

export type PricingLine = {
  label: string
  amount: number
  hint?: string
}

type PricingBreakdownProps = {
  lines: PricingLine[]
  /** When set, shown as total (must match quote; avoids drift vs server). */
  totalRupees?: number
  eyebrow?: string
  className?: string
}

export function PricingBreakdown({ lines, totalRupees, eyebrow = 'Transparent pricing', className }: PricingBreakdownProps) {
  const computedTotal = lines.reduce((s, l) => s + l.amount, 0)
  const total = totalRupees ?? computedTotal
  return (
    <div
      className={cn(
        cardSurfaceBase,
        cardSurfaceTransition,
        cardPadding,
        'backdrop-blur-sm',
        className,
      )}
    >
      <p className={cardEyebrow}>{eyebrow}</p>
      <ul className="mt-5 space-y-3.5">
        {lines.map((line) => (
          <li key={line.label} className="flex items-start justify-between gap-4 text-sm">
            <div className="min-w-0">
              <p className="font-medium tracking-[-0.01em] text-soft">{line.label}</p>
              {line.hint ? <p className="mt-0.5 text-xs leading-relaxed text-muted">{line.hint}</p> : null}
            </div>
            <p className="shrink-0 tabular-nums text-muted">{formatInr(line.amount)}</p>
          </li>
        ))}
      </ul>
      <div className="mt-5 flex items-center justify-between border-t border-stroke pt-4 text-base font-semibold tracking-[-0.02em] text-soft">
        <span>Total</span>
        <span className="tabular-nums">{formatInr(total)}</span>
      </div>
    </div>
  )
}
