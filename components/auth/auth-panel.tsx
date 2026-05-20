'use client'

import { useEffect, useId, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeft,
  Fingerprint,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Smartphone,
} from 'lucide-react'

import { BrandLogo } from '@/components/layout/brand-logo'
import { captureClientEvent, identifyClientUser } from '@/lib/analytics/capture-client'
import { POSTHOG_EVENTS } from '@/lib/analytics/posthog-events'
import { DataLoadErrorPanel } from '@/components/ui/data-load-error'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { BRAND } from '@/constants/brand'
import { getOAuthCallbackUrl } from '@/lib/auth/callback-url'
import { appRoleFromUser } from '@/hooks/use-app-auth-role'
import { resolvePostLoginPath } from '@/lib/auth/post-login-path'
import { debugLogRoleResolution } from '@/lib/auth/role-debug'
import { formatAuthError } from '@/lib/errors/format-auth-error'
import { normalizePhoneToE164 } from '@/lib/auth/normalize-phone'
import { cn } from '@/lib/utils/cn'
import { useSupabase } from '@/hooks/use-supabase'

const ease = [0.22, 1, 0.36, 1] as const

type AuthStep = 'methods' | 'otp'
type OtpPhase = 'phone' | 'verify'
type Pending = null | 'google' | 'email' | 'otp-send' | 'otp-verify'

const trustItems = [
  {
    icon: Lock,
    label: 'TLS 1.3',
    sub: 'Encrypted sessions',
  },
  {
    icon: ShieldCheck,
    label: 'Verified access',
    sub: 'Fleet & identity checks',
  },
  {
    icon: Fingerprint,
    label: 'Biometric-ready',
    sub: 'Step-up when required',
  },
] as const

const methodsRoot = {
  hidden: { opacity: 0, x: -12 },
  show: {
    opacity: 1,
    x: 0,
    transition: { staggerChildren: 0.07, delayChildren: 0.08, ease },
  },
  exit: { opacity: 0, x: 10, transition: { duration: 0.24, ease } },
}

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.38, ease } },
}

function maskE164ForDisplay(e164: string): string {
  if (e164.length < 8) return e164
  return `${e164.slice(0, 4)}••••${e164.slice(-2)}`
}

/** Gmail / Google account sign-in mark (multicolor “G”). */
function GmailMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden xmlns="http://www.w3.org/2000/svg">
      <path
        fill="#EA4335"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#4285F4"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}

function MethodSurface({
  children,
  className,
  glow = 'electric',
  disabled = false,
}: {
  children: React.ReactNode
  className?: string
  glow?: 'electric' | 'neutral'
  disabled?: boolean
}) {
  return (
    <motion.div
      whileHover={disabled ? undefined : { y: -2, transition: { duration: 0.28, ease } }}
      whileTap={disabled ? undefined : { scale: 0.985 }}
      className={cn(
        'relative overflow-hidden rounded-2xl border transition-[border-color,box-shadow,background-color] duration-300',
        glow === 'electric'
          ? 'border-stroke-strong bg-gradient-to-b from-fill-glass-strong to-fill-glass shadow-[0_1px_0_0_rgba(255,255,255,0.12)_inset,0_18px_48px_-28px_rgba(59,130,246,0.35)] hover:border-electric/35 hover:shadow-[0_1px_0_0_rgba(255,255,255,0.14)_inset,0_22px_56px_-26px_rgba(59,130,246,0.45)]'
          : 'border-stroke bg-fill-glass shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] hover:border-stroke-strong hover:bg-fill-glass-strong',
        className,
      )}
    >
      {children}
    </motion.div>
  )
}

type AuthPanelProps = {
  initialAuthError?: string
  redirectTo?: string
}

export function AuthPanel({ initialAuthError, redirectTo }: AuthPanelProps) {
  const headingId = useId()
  const router = useRouter()
  const supabase = useSupabase()

  const [step, setStep] = useState<AuthStep>('methods')
  const [otpPhase, setOtpPhase] = useState<OtpPhase>('phone')
  const [showEmail, setShowEmail] = useState(false)
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [sentPhone, setSentPhone] = useState<string | null>(null)

  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [pending, setPending] = useState<Pending>(null)

  useEffect(() => {
    if (initialAuthError) {
      setError(initialAuthError)
    }
  }, [initialAuthError])

  const shellClassName = cn(
    'relative overflow-hidden rounded-[1.375rem] border border-stroke-strong',
    'bg-gradient-to-br from-fill-glass-strong via-fill-glass to-transparent',
    'p-6 shadow-[0_1px_0_0_rgba(255,255,255,0.1)_inset,0_32px_90px_-40px_rgba(0,0,0,0.88)]',
    'backdrop-blur-[44px] sm:rounded-[1.75rem] sm:p-8 sm:shadow-[0_1px_0_0_rgba(255,255,255,0.1)_inset,0_40px_100px_-44px_rgba(0,0,0,0.9)]',
  )

  if (!supabase) {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease }}
        className={shellClassName}
      >
        <div
          className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-electric/[0.14] blur-[100px]"
          aria-hidden
        />
        <div className="relative space-y-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-200/90">Sign-in</p>
          <DataLoadErrorPanel
            title="Sign-in is not available"
            description="This environment is not fully configured. Please try again later or contact support if the issue continues."
            className="text-left shadow-none"
          />
          {initialAuthError ? (
            <div
              role="alert"
              className="rounded-xl border border-stroke bg-fill-glass px-4 py-3 text-sm text-muted"
            >
              {initialAuthError}
            </div>
          ) : null}
        </div>
      </motion.div>
    )
  }

  const sb = supabase

  const nextPath = resolvePostLoginPath('customer', redirectTo)
  const callbackUrl =
    typeof window !== 'undefined'
      ? getOAuthCallbackUrl(nextPath, window.location.origin)
      : getOAuthCallbackUrl(nextPath)

  const resetFlowMessages = () => {
    setError(null)
    setInfo(null)
  }

  const resetOtp = () => {
    setOtpPhase('phone')
    setOtp('')
    setSentPhone(null)
  }

  const handleGoogle = async () => {
    if (!callbackUrl) return
    resetFlowMessages()
    setPending('google')
    try {
      captureClientEvent(POSTHOG_EVENTS.authMethodStarted, { method: 'google' })
      const { data, error: err } = await sb.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl,
          skipBrowserRedirect: false,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      })
      if (err) {
        setError(formatAuthError(err))
        return
      }
      if (data.url) {
        window.location.assign(data.url)
      } else {
        setError('Could not start Google sign-in. Please try again.')
      }
    } catch (e) {
      setError(formatAuthError(e instanceof Error ? e : undefined))
    } finally {
      setPending(null)
    }
  }

  const handleEmailLink = async () => {
    resetFlowMessages()
    const trimmed = email.trim()
    if (!trimmed || !trimmed.includes('@')) {
      setError('Enter a valid email address.')
      return
    }
    if (!callbackUrl) {
      console.error('[auth-panel] missing origin for callback URL')
      setError('Could not start sign-in from this page. Open the app in your browser and try again.')
      return
    }
    setPending('email')
    try {
      captureClientEvent(POSTHOG_EVENTS.authMethodStarted, { method: 'email_magic_link' })
      const { error: err } = await sb.auth.signInWithOtp({
        email: trimmed,
        options: {
          emailRedirectTo: callbackUrl,
          shouldCreateUser: true,
        },
      })
      if (err) {
        setError(formatAuthError(err))
        return
      }
      setInfo('Check your inbox for a secure sign-in link. It may take a minute to arrive.')
    } catch (e) {
      setError(formatAuthError(e instanceof Error ? e : undefined))
    } finally {
      setPending(null)
    }
  }

  const handlePhoneSend = async () => {
    resetFlowMessages()
    const e164 = normalizePhoneToE164(phone)
    if (!e164) {
      setError('Use a valid Indian mobile (+91) or enter a full international number with +.')
      return
    }
    setPending('otp-send')
    try {
      captureClientEvent(POSTHOG_EVENTS.authMethodStarted, { method: 'phone_otp_send' })
      const { error: err } = await sb.auth.signInWithOtp({
        phone: e164,
        options: {
          channel: 'sms',
          shouldCreateUser: true,
        },
      })
      if (err) {
        setError(formatAuthError(err))
        return
      }
      setSentPhone(e164)
      setOtpPhase('verify')
      setInfo('Code sent. Enter the 6-digit OTP from your SMS.')
    } catch (e) {
      setError(formatAuthError(e instanceof Error ? e : undefined))
    } finally {
      setPending(null)
    }
  }

  const handlePhoneVerify = async () => {
    resetFlowMessages()
    const token = otp.replace(/\D/g, '')
    if (!sentPhone || token.length < 6) {
      setError('Enter the 6-digit code from your SMS.')
      return
    }
    setPending('otp-verify')
    try {
      const { error: err } = await sb.auth.verifyOtp({
        phone: sentPhone,
        token,
        type: 'sms',
      })
      if (err) {
        setError(formatAuthError(err))
        return
      }
      const {
        data: { session },
      } = await sb.auth.getSession()
      const user = session?.user ?? null
      if (user?.id) {
        identifyClientUser(user.id)
      }
      const appRole = appRoleFromUser(user)
      const destination = resolvePostLoginPath(appRole, redirectTo)
      debugLogRoleResolution('auth-panel/otp', {
        userId: user?.id,
        email: user?.email,
        app_metadata: user?.app_metadata,
        user_metadata: user?.user_metadata,
        resolved: appRole,
        redirectTo,
        destination,
      })
      captureClientEvent(POSTHOG_EVENTS.loginCompleted, { method: 'phone_otp', app_role: appRole })
      router.push(destination)
      router.refresh()
    } catch (e) {
      setError(formatAuthError(e instanceof Error ? e : undefined))
    } finally {
      setPending(null)
    }
  }

  const busy = pending !== null

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease }}
      className={shellClassName}
    >
      <div
        className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-electric/[0.14] blur-[100px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-16 bottom-0 h-64 w-64 rounded-full bg-fill-glass-strong blur-[90px]"
        aria-hidden
      />

      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative flex h-12 w-28 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-stroke-strong bg-matte/40 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]">
              <BrandLogo className="h-10 w-auto max-w-[6.5rem]" priority />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-electric">
                Secure access
              </p>
              <p id={headingId} className="mt-1 truncate text-xl font-semibold tracking-[-0.03em] text-soft sm:text-2xl">
                {BRAND.name}
              </p>
            </div>
          </div>
        </div>

        <p className="mt-5 text-[0.9375rem] font-medium leading-relaxed text-soft/90 sm:text-base">
          Sign in with the method you prefer. Same vault-grade session, whichever path you choose.
        </p>

        {error ? (
          <div
            role="alert"
            className="mt-5 rounded-xl border border-red-400/25 bg-red-500/[0.08] px-4 py-3 text-sm leading-relaxed text-red-100/95"
          >
            {error}
          </div>
        ) : null}

        {info ? (
          <div className="mt-5 rounded-xl border border-emerald-400/20 bg-emerald-500/[0.07] px-4 py-3 text-sm leading-relaxed text-emerald-50/95">
            {info}
          </div>
        ) : null}

        <AnimatePresence mode="wait">
          {step === 'otp' ? (
            <motion.div
              className="mt-6 space-y-5"
              role="region"
              aria-labelledby={headingId}
            >
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setStep('methods')
                  resetOtp()
                  resetFlowMessages()
                }}
                className="group inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-soft disabled:pointer-events-none disabled:opacity-40"
              >
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" aria-hidden />
                All sign-in options
              </button>

              {otpPhase === 'phone' ? (
                <>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Mobile OTP</p>
                    <p className="mt-2 text-sm text-silver">
                      We&apos;ll send a one-time code to your Indian mobile number. Codes expire in ten minutes.
                    </p>
                  </div>
                  <Input
                    label="Mobile number"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="+91 98XXX XXXXX"
                    value={phone}
                    disabled={busy}
                    onChange={(e) => setPhone(e.target.value)}
                    className="min-h-[3.25rem] text-[1.0625rem] tracking-wide"
                  />
                  <Button
                    type="button"
                    size="lg"
                    disabled={busy}
                    onClick={() => void handlePhoneSend()}
                    className="min-h-[3.35rem] w-full text-base shadow-[0_16px_48px_-22px_rgba(59,130,246,0.55)]"
                  >
                    {pending === 'otp-send' ? (
                      <>
                        <Loader2 className="h-5 w-5 shrink-0 animate-spin" aria-hidden />
                        Sending…
                      </>
                    ) : (
                      'Send one-time code'
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Enter code</p>
                    <p className="mt-2 text-sm text-silver">
                      Sent to <span className="font-mono text-soft/95">{maskE164ForDisplay(sentPhone ?? '')}</span>
                    </p>
                  </div>
                  <Input
                    label="6-digit code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="• • • • • •"
                    maxLength={6}
                    value={otp}
                    disabled={busy}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="min-h-[3.25rem] text-center text-[1.25rem] font-medium tracking-[0.35em] text-soft"
                  />
                  <Button
                    type="button"
                    size="lg"
                    disabled={busy}
                    onClick={() => void handlePhoneVerify()}
                    className="min-h-[3.35rem] w-full text-base shadow-[0_16px_48px_-22px_rgba(59,130,246,0.55)]"
                  >
                    {pending === 'otp-verify' ? (
                      <>
                        <Loader2 className="h-5 w-5 shrink-0 animate-spin" aria-hidden />
                        Verifying…
                      </>
                    ) : (
                      'Verify & continue'
                    )}
                  </Button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      resetOtp()
                      resetFlowMessages()
                    }}
                    className="w-full text-center text-sm font-medium text-muted underline-offset-2 transition-colors hover:text-soft disabled:pointer-events-none disabled:opacity-40"
                  >
                    Use a different number
                  </button>
                </>
              )}

              <p className="text-center text-xs leading-relaxed text-muted">
                Carrier rates may apply. By continuing you agree to our{' '}
                <a href="/terms" className="text-electric/90 underline-offset-2 hover:underline">
                  Terms
                </a>{' '}
                and{' '}
                <a href="/privacy" className="text-electric/90 underline-offset-2 hover:underline">
                  Privacy
                </a>
                .
              </p>
            </motion.div>
          ) : (
            <motion.div
              className="mt-6 space-y-5"
              variants={methodsRoot}
              initial="hidden"
              animate="show"
              exit="exit"
            >
              <motion.div variants={item} className="space-y-3">
                <MethodSurface glow="electric" className="w-full" disabled={busy}>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void handleGoogle()}
                    className="flex min-h-[3.35rem] w-full touch-manipulation items-center justify-center gap-3 px-5 text-base font-semibold tracking-[-0.01em] text-soft disabled:pointer-events-none disabled:opacity-40"
                  >
                    {pending === 'google' ? (
                      <Loader2 className="h-[22px] w-[22px] shrink-0 animate-spin text-soft" aria-hidden />
                    ) : (
                      <GmailMark className="h-[22px] w-[22px] shrink-0" />
                    )}
                    Continue with Google
                  </button>
                </MethodSurface>

                <MethodSurface glow="neutral" className="w-full" disabled={busy}>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      resetFlowMessages()
                      resetOtp()
                      setStep('otp')
                    }}
                    className="flex min-h-[3.35rem] w-full touch-manipulation items-center justify-center gap-3 px-5 text-base font-semibold tracking-[-0.01em] text-soft disabled:pointer-events-none disabled:opacity-40"
                  >
                    <Smartphone className="h-[22px] w-[22px] text-electric" aria-hidden />
                    Continue with mobile OTP
                  </button>
                </MethodSurface>
              </motion.div>

              <motion.div variants={item} className="relative py-1">
                <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                <p className="relative mx-auto w-max bg-[rgba(10,10,12,0.72)] px-3 text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-silver backdrop-blur-sm">
                  Professional email
                </p>
              </motion.div>

              <motion.div variants={item}>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setShowEmail((v) => !v)}
                  aria-expanded={showEmail}
                  className="flex min-h-[3.35rem] w-full touch-manipulation items-center justify-center gap-3 rounded-2xl border border-stroke-strong bg-fill-glass px-5 text-base font-semibold text-soft transition-[border-color,background-color,color,box-shadow] duration-300 hover:border-stroke-strong hover:bg-fill-glass-strong hover:text-soft disabled:pointer-events-none disabled:opacity-40"
                >
                  <Mail className="h-[22px] w-[22px] shrink-0 text-electric" strokeWidth={2} aria-hidden />
                  {showEmail ? 'Hide email sign-in' : 'Continue with email'}
                </button>

                <AnimatePresence initial={false}>
                  {showEmail ? (
                    <motion.div
                      key="email-fields"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-4 pt-5">
                        <Input
                          label="Work or personal email"
                          type="email"
                          autoComplete="email"
                          placeholder="you@studio.com"
                          value={email}
                          disabled={busy}
                          onChange={(e) => setEmail(e.target.value)}
                          className="min-h-[3.25rem] text-[1.0625rem]"
                        />
                        <Button
                          type="button"
                          size="lg"
                          disabled={busy}
                          onClick={() => void handleEmailLink()}
                          className="min-h-[3.35rem] w-full text-base shadow-[0_16px_48px_-22px_rgba(59,130,246,0.55)]"
                        >
                          {pending === 'email' ? (
                            <>
                              <Loader2 className="h-5 w-5 shrink-0 animate-spin" aria-hidden />
                              Sending link…
                            </>
                          ) : (
                            'Email secure link'
                          )}
                        </Button>
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </motion.div>

              <motion.div variants={item} className="grid gap-2.5 sm:grid-cols-3" role="list" aria-label="Security highlights">
                {trustItems.map(({ icon: Icon, label, sub }) => (
                  <div
                    key={label}
                    role="listitem"
                    className="rounded-xl border border-stroke-strong bg-matte/55 px-3 py-3 text-left shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] backdrop-blur-sm"
                  >
                    <Icon className="h-4 w-4 text-electric" aria-hidden />
                    <p className="mt-2 text-[11.5px] font-semibold uppercase tracking-[0.14em] text-soft">{label}</p>
                    <p className="mt-1 text-xs font-medium leading-snug text-silver">{sub}</p>
                  </div>
                ))}
              </motion.div>

              <motion.p variants={item} className="text-center text-xs leading-relaxed text-silver">
                Enterprise fleets can request delegated SSO after verification. Need help?{' '}
                <a href="/support" className="font-semibold text-electric underline-offset-2 hover:underline">
                  Concierge
                </a>
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
