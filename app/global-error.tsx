'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'

/**
 * Root-level error boundary — catches errors that escape every nested layout
 * (including provider failures). Without this file Next.js falls back to a
 * blank "Application error: a client-side exception has occurred" screen.
 *
 * Must declare its own <html> + <body> because it replaces the root layout.
 */
export default function GlobalError({
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
    <html lang="en" data-theme="dark">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          backgroundColor: '#080706',
          color: '#f8f2e8',
          fontFamily:
            '"Inter", "Helvetica Neue", system-ui, -apple-system, "Segoe UI", Roboto, "Apple Color Emoji", "Segoe UI Emoji", sans-serif',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
        }}
      >
        <div
          style={{
            maxWidth: '28rem',
            width: '100%',
            textAlign: 'center',
            padding: '2rem',
            borderRadius: '1.5rem',
            border: '1px solid rgba(255,255,255,0.08)',
            background:
              'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
            boxShadow: '0 24px 80px -40px rgba(0,0,0,0.85)',
          }}
        >
          <p
            style={{
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: '#e6c17d',
              margin: 0,
            }}
          >
            Oxour Go
          </p>
          <h1
            style={{
              marginTop: '0.75rem',
              fontSize: '1.5rem',
              fontWeight: 600,
              letterSpacing: '-0.03em',
              color: '#f8f2e8',
              lineHeight: 1.2,
            }}
          >
            Something went wrong
          </h1>
          <p
            style={{
              marginTop: '0.75rem',
              fontSize: '0.9375rem',
              lineHeight: 1.6,
              color: '#a99b88',
            }}
          >
            The page hit an unexpected error. You can retry, return home, or message concierge on WhatsApp.
          </p>
          {error?.digest ? (
            <p
              style={{
                marginTop: '1rem',
                fontFamily:
                  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                fontSize: '11px',
                color: 'rgba(169,155,136,0.7)',
              }}
            >
              ref · {error.digest}
            </p>
          ) : null}
          <div
            style={{
              marginTop: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              alignItems: 'stretch',
            }}
          >
            <button
              type="button"
              onClick={() => reset()}
              style={{
                minHeight: '2.75rem',
                padding: '0.5rem 1.25rem',
                borderRadius: '9999px',
                border: '1px solid rgba(214,170,107,0.7)',
                background: 'linear-gradient(135deg,#d8b06d,#b98743)',
                color: '#161009',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              style={{
                minHeight: '2.75rem',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.5rem 1.25rem',
                borderRadius: '9999px',
                border: '1px solid rgba(255,255,255,0.16)',
                color: '#f8f2e8',
                fontSize: '0.875rem',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Back to home
            </a>
          </div>
        </div>
      </body>
    </html>
  )
}
