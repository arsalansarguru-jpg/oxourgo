import * as Sentry from '@sentry/nextjs'

import { scrubSentryBreadcrumb, scrubSentryEvent } from '@/lib/monitoring/sentry-event-scrub'
import {
  getSentryDsn,
  getSentryEnvironment,
  getSentryRelease,
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
    tracesSampleRate: process.env.NODE_ENV === 'development' ? 0.5 : 0.05,
    beforeSend: scrubSentryEvent,
    beforeBreadcrumb: scrubSentryBreadcrumb,
  })
}
