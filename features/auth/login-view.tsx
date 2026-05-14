'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'

import { AuthPanel } from '@/components/auth/auth-panel'
import { LoginHeroPanel } from '@/components/auth/login-hero-panel'
import { captureClientEvent } from '@/lib/analytics/capture-client'
import { POSTHOG_EVENTS } from '@/lib/analytics/posthog-events'
import { BRAND } from '@/constants/brand'

const ease = [0.22, 1, 0.36, 1] as const

type LoginViewProps = {
  initialAuthError?: string
  /** Post-auth destination (internal path), e.g. from `/login?redirect=/booking/uuid` */
  redirectTo?: string
}

export function LoginView({ initialAuthError, redirectTo }: LoginViewProps) {
  useEffect(() => {
    captureClientEvent(POSTHOG_EVENTS.loginPageViewed, { step: 'login_page' })
  }, [])

  return (
    <div className="relative min-h-[calc(100dvh-3.25rem)] sm:min-h-[calc(100dvh-3.5rem)] lg:min-h-[calc(100dvh-4rem)]">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_85%_55%_at_50%_-8%,rgba(59,130,246,0.14),transparent_55%),radial-gradient(ellipse_50%_40%_at_100%_60%,rgba(255,255,255,0.04),transparent_50%),linear-gradient(180deg,rgba(10,10,12,0.98)_0%,#0a0a0c_38%,#0c0c10_100%)]"
        aria-hidden
      />

      <div className="relative z-[1] mx-auto flex w-full max-w-[var(--container-wide)] flex-col gap-6 px-[var(--spacing-edge)] pb-8 pt-6 sm:gap-8 sm:pb-10 sm:pt-8 lg:grid lg:min-h-[calc(100dvh-4.25rem)] lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:items-stretch lg:gap-0 lg:px-8 lg:pb-12 lg:pt-10 xl:px-10">
        {/* Mobile / tablet: auth first for thumb reach; desktop: hero left */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
          className="order-1 flex w-full max-w-lg shrink-0 self-center lg:order-2 lg:max-w-none lg:self-stretch lg:pl-8 xl:pl-12"
        >
          <div className="flex w-full flex-1 flex-col justify-center lg:py-4">
            <AuthPanel initialAuthError={initialAuthError} redirectTo={redirectTo} />
            <p className="mt-6 text-center text-[11px] leading-relaxed text-muted lg:mt-8">
              <Link href="/" className="font-medium text-silver/90 underline-offset-4 transition-colors hover:text-soft">
                ← Back to {BRAND.name}
              </Link>
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.05, ease }}
          className="order-2 flex min-h-0 w-full flex-col lg:order-1 lg:h-full lg:pr-8 xl:pr-10"
        >
          <LoginHeroPanel className="flex-1 lg:min-h-0" />
        </motion.div>
      </div>
    </div>
  )
}
