import * as Sentry from '@sentry/nextjs'

import { scrubSentryBreadcrumb, scrubSentryEvent } from '@/lib/monitoring/sentry-event-scrub'
import {
  getSentryDsn,
  getSentryEnvironment,
  getSentryRelease,
  getSentryTracesSampleRate,
  isSentryVerboseLogging,
} from '@/lib/monitoring/sentry-runtime-env'

const dsn = getSentryDsn()

if (dsn) {
  Sentry.init({
    dsn,
    environment: getSentryEnvironment(),
    release: getSentryRelease(),
    sendDefaultPii: false,
    debug: isSentryVerboseLogging(),
    tracesSampleRate: getSentryTracesSampleRate(),
    beforeSend: scrubSentryEvent,
    beforeBreadcrumb: scrubSentryBreadcrumb,
  })
}
