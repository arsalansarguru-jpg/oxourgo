'use client'

import * as Sentry from '@sentry/nextjs'
import NextError from 'next/error'
import { useEffect } from 'react'

import './globals.css'

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-w-0 overflow-x-clip font-sans antialiased" suppressHydrationWarning>
        <NextError statusCode={0} />
      </body>
    </html>
  )
}
