/** Whether verbose SDK logging is enabled (development only). */
export function isSentryVerboseLogging(): boolean {
  return process.env.NODE_ENV === 'development'
}

export function getSentryDsn(): string | undefined {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN?.trim()
  return dsn || undefined
}

export function getSentryEnvironment(): string {
  return (
    process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT?.trim() ||
    process.env.VERCEL_ENV?.trim() ||
    process.env.NODE_ENV ||
    'development'
  )
}

export function getSentryRelease(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_SENTRY_RELEASE?.trim() ||
    process.env.VERCEL_GIT_COMMIT_SHA?.trim() ||
    process.env.SENTRY_RELEASE?.trim() ||
    undefined
  )
}

/** Performance trace sampling: override with NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE (0–1). */
export function getSentryTracesSampleRate(): number {
  const raw = process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE?.trim()
  if (raw !== undefined && raw !== '') {
    const n = Number(raw)
    if (!Number.isNaN(n)) return Math.min(1, Math.max(0, n))
  }
  return process.env.NODE_ENV === 'development' ? 1 : 0.12
}
