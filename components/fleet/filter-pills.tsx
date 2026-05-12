import type { FleetFilterId } from '@/lib/fleet/types'
import { cn } from '@/lib/utils/cn'

type FilterPillsProps = {
  active: Set<string>
  onToggle: (id: FleetFilterId) => void
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

const order: FleetFilterId[] = [
  'SUV',
  'Sedan',
  'Hatchback',
  'Luxury',
  'Budget',
  'Automatic',
  'Manual',
]

export function FilterPills({ active, onToggle, className }: FilterPillsProps) {
  return (
    <div className={cn('flex flex-wrap gap-2 sm:gap-2.5', className)}>
      {order.map((id) => {
        const isOn = active.has(id)
        return (
          <button
            key={id}
            type="button"
            onClick={() => onToggle(id)}
            className={cn(
              'touch-manipulation min-h-10 rounded-full border px-3.5 py-2 text-xs font-semibold tracking-[-0.01em] transition-[border-color,background-color,color,transform,box-shadow] duration-300 active:scale-[0.97] sm:min-h-0 sm:py-1.5',
              isOn
                ? 'border-electric/45 bg-electric/14 text-soft shadow-[0_0_0_1px_rgba(59,130,246,0.12),0_14px_40px_-26px_rgba(59,130,246,0.35)] hover:brightness-[1.03]'
                : 'border-white/[0.1] bg-white/[0.04] text-muted shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] hover:border-white/[0.18] hover:bg-white/[0.07] hover:text-soft',
            )}
          >
            {labels[id]}
          </button>
        )
      })}
    </div>
  )
}
