import type { ReactNode } from 'react'

import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils/cn'

export type DataLoadErrorPanelProps = {
  title?: string
  description?: string
  className?: string
  /** Client refresh (e.g. `() => router.refresh()`). */
  onRetry?: () => void
  /** In-app navigation retry (server components). */
  retryTo?: string
  retryLabel?: ReactNode
}

/**
 * Premium, non-leaky error surface for failed data loads (no DB / stack text).
 */
export function DataLoadErrorPanel({
  title = 'Unable to load data',
  description = 'Please refresh the page or try again shortly.',
  className,
  onRetry,
  retryTo,
  retryLabel = 'Try again',
}: DataLoadErrorPanelProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-stroke bg-fill-glass p-6 text-center shadow-[var(--shadow-card)] sm:rounded-3xl sm:p-8',
        className,
      )}
    >
      <h3 className="text-lg font-semibold tracking-[-0.02em] text-soft">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">{description}</p>
      {retryTo ? (
        <Button className="mt-5" variant="secondary" to={retryTo}>
          {retryLabel}
        </Button>
      ) : onRetry ? (
        <Button type="button" className="mt-5" variant="secondary" onClick={onRetry}>
          {retryLabel}
        </Button>
      ) : null}
    </div>
  )
}
