import { Check } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

type BookingStepperProps = {
  steps: string[]
  current: number
  className?: string
}

export function BookingStepper({ steps, current, className }: BookingStepperProps) {
  return (
    <ol
      className={cn(
        'flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch] sm:snap-none sm:flex-wrap sm:items-center sm:gap-2 sm:overflow-visible sm:pb-0',
        className,
      )}
    >
      {steps.map((label, idx) => {
        const stepNum = idx + 1
        const done = stepNum < current
        const active = stepNum === current
        return (
          <li
            key={label}
            className="flex min-w-[min(100%,280px)] shrink-0 snap-start items-center gap-2 sm:min-w-0 sm:snap-none sm:gap-3"
          >
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <span
                className={cn(
                  'flex h-11 w-11 shrink-0 items-center justify-center rounded-full border text-sm font-bold sm:h-8 sm:w-8 sm:text-xs',
                  done && 'border-emerald/40 bg-emerald/15 text-emerald',
                  active && 'border-electric/40 bg-electric/10 text-electric',
                  !done && !active && 'border-stroke bg-fill-glass text-muted',
                )}
                aria-current={active ? 'step' : undefined}
              >
                {done ? <Check className="h-4 w-4 sm:h-3.5 sm:w-3.5" aria-hidden /> : stepNum}
              </span>
              <span
                className={cn(
                  'min-w-0 truncate text-sm font-medium sm:whitespace-normal',
                  active ? 'text-soft' : done ? 'text-silver' : 'text-muted',
                )}
              >
                {label}
              </span>
            </div>
            {idx < steps.length - 1 ? (
              <span className="mx-0.5 hidden h-px w-6 shrink-0 bg-stroke sm:mx-1 sm:block" aria-hidden />
            ) : null}
          </li>
        )
      })}
    </ol>
  )
}
