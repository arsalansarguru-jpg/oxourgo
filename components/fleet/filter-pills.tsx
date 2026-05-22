import { Check } from 'lucide-react'

import type { FleetCar, FleetFilterId } from '@/lib/fleet/types'
import { countCarsForFilter } from '@/lib/fleet/filter-utils'
import { cn } from '@/lib/utils/cn'

type FilterPillsProps = {
  active: Set<string>
  onToggle: (id: FleetFilterId) => void
  cars?: FleetCar[]
  layout?: 'inline' | 'stacked'
  className?: string
}

const labels: Record<FleetFilterId, string> = {
  SUV: 'SUV',
  Sedan: 'Sedan',
  Hatchback: 'Hatchback',
  Luxury: 'Luxury',
  Budget: 'Budget',
  Automatic: 'Automatic',
  Manual: 'Manual',
}

const categories: FleetFilterId[] = ['SUV', 'Sedan', 'Hatchback', 'Luxury', 'Budget']
const transmissions: FleetFilterId[] = ['Automatic', 'Manual']

function PillRow({
  ids,
  active,
  onToggle,
  cars,
  className,
}: {
  ids: FleetFilterId[]
  active: Set<string>
  onToggle: (id: FleetFilterId) => void
  cars?: FleetCar[]
  className?: string
}) {
  return (
    <div className={cn('flex flex-wrap gap-2 sm:gap-2.5', className)}>
      {ids.map((id) => {
        const isOn = active.has(id)
        const count = cars ? countCarsForFilter(cars, id, active) : null
        return (
          <button
            key={id}
            type="button"
            aria-pressed={isOn}
            onClick={() => onToggle(id)}
            className={cn(
              'touch-manipulation inline-flex min-h-11 min-w-[2.75rem] items-center justify-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold tracking-[-0.01em] transition-[border-color,background-color,color,transform,box-shadow] duration-300 focus-visible:shadow-none active:scale-[0.97]',
              isOn
                ? 'border-electric bg-electric text-white shadow-[0_0_0_1px_rgba(59,130,246,0.45),0_12px_36px_-18px_rgba(59,130,246,0.55)] hover:brightness-[1.06]'
                : 'border-stroke bg-fill-glass text-muted shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] hover:border-stroke-strong hover:bg-fill-glass-strong hover:text-soft',
            )}
          >
            {isOn ? <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={2.75} aria-hidden /> : null}
            <span>{labels[id]}</span>
            {count !== null ? (
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums',
                  isOn ? 'bg-white/20 text-white' : 'bg-white/[0.06] text-muted',
                )}
              >
                {count}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}

export function FilterPills({ active, onToggle, cars, layout = 'inline', className }: FilterPillsProps) {
  if (layout === 'stacked') {
    return (
      <div className={cn('space-y-5', className)}>
        <div>
          <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">Body style</p>
          <PillRow ids={categories} active={active} onToggle={onToggle} cars={cars} />
        </div>
        <div>
          <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">Transmission</p>
          <PillRow ids={transmissions} active={active} onToggle={onToggle} cars={cars} />
        </div>
      </div>
    )
  }

  const order: FleetFilterId[] = [...categories, ...transmissions]
  return <PillRow ids={order} active={active} onToggle={onToggle} cars={cars} className={className} />
}
