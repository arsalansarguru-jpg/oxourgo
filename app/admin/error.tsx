'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'

import { Button } from '@/components/ui/Button'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col items-center justify-center gap-4 px-4 py-12 text-center">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-electric/90">Admin</p>
      <h1 className="text-xl font-semibold tracking-[-0.03em] text-soft sm:text-2xl">
        Something went wrong loading this view
      </h1>
      <p className="text-sm leading-relaxed text-muted">
        The dashboard hit an unexpected error. You can retry, return to the command center, or open a different section
        from the sidebar.
      </p>
      {error?.digest ? (
        <p className="font-mono text-[11px] text-muted/70">ref · {error.digest}</p>
      ) : null}
      <div className="mt-2 flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
        <Button type="button" className="min-h-11 w-full sm:w-auto" onClick={() => reset()}>
          Try again
        </Button>
        <Button type="button" variant="secondary" className="min-h-11 w-full sm:w-auto" to="/admin">
          Command center
        </Button>
      </div>
    </div>
  )
}
