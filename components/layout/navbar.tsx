'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ChevronDown, LogOut, Menu, MessageCircle, X } from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import { AnimatePresence, motion } from 'framer-motion'
import { BRAND } from '@/constants/brand'
import { useSupabase } from '@/hooks/use-supabase'
import { useSupabaseAuthUser } from '@/hooks/use-supabase-auth-user'
import { cn } from '@/lib/utils/cn'
import { WhatsAppInquiryButton } from '@/components/marketing/whatsapp-inquiry-button'
import { Button } from '@/components/ui/Button'
import { BrandLogo } from '@/components/layout/brand-logo'
import { ThemeToggle } from '@/components/layout/theme-toggle'

const nav = [
  { href: '/fleet', label: 'Fleet' },
  { href: '/about', label: 'About' },
  { href: '/support', label: 'Support' },
] as const

const ease = [0.22, 1, 0.36, 1] as const

function avatarUrlFromUser(user: User): string | null {
  const m = user.user_metadata as Record<string, unknown> | undefined
  const v = m?.avatar_url ?? m?.picture
  return typeof v === 'string' && v.length > 0 ? v : null
}

function initialsFromUser(user: User): string {
  const m = user.user_metadata as Record<string, unknown> | undefined
  const name = m?.full_name ?? m?.name
  if (typeof name === 'string' && name.trim()) {
    const parts = name.trim().split(/\s+/)
    const a = parts[0]?.[0] ?? ''
    const b = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : ''
    const s = (a + b).toUpperCase()
    return s || a.toUpperCase() || '?'
  }
  const e = user.email ?? ''
  return e.slice(0, 2).toUpperCase() || '?'
}

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = useSupabase()
  const { user, ready } = useSupabaseAuthUser()
  const accountMenuRef = useRef<HTMLDetailsElement>(null)
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  const avatarUrl = user ? avatarUrlFromUser(user) : null

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  useEffect(() => {
    setOpen(false)
    accountMenuRef.current?.removeAttribute('open')
  }, [pathname])

  async function handleSignOut() {
    if (!supabase || signingOut) return
    setSigningOut(true)
    try {
      await supabase.auth.signOut()
      accountMenuRef.current?.removeAttribute('open')
      setOpen(false)
      router.refresh()
    } finally {
      setSigningOut(false)
    }
  }

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-50 border-b pt-[var(--safe-top)] transition-[background-color,backdrop-filter,border-color,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
          scrolled
            ? 'border-stroke bg-matte/[0.78] shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset,0_18px_48px_-28px_rgba(0,0,0,0.75)] backdrop-blur-2xl backdrop-saturate-[1.35] supports-[backdrop-filter]:bg-matte/[0.62]'
            : 'border-stroke bg-matte/[0.52] shadow-[0_24px_64px_-40px_rgba(0,0,0,0.55)] backdrop-blur-3xl backdrop-saturate-[1.2] supports-[backdrop-filter]:bg-matte/[0.38]',
        )}
      >
        <div className="container-app grid min-h-[3.25rem] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 sm:min-h-14 lg:min-h-[3.75rem] lg:gap-4">
          <Link
            href="/"
            className="group flex min-w-0 max-w-[min(100%,14rem)] items-center gap-2.5 justify-self-start sm:max-w-none sm:gap-3"
            onClick={() => setOpen(false)}
          >
            <div
              className={cn(
                'relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-[0.625rem] border border-stroke bg-gradient-to-b from-fill-glass-strong to-fill-glass shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12),0_0_0_1px_rgba(0,0,0,0.35)] transition-[transform,box-shadow,border-color] duration-300 sm:h-9 sm:w-9 sm:rounded-[0.6875rem]',
                'group-hover:-translate-y-px group-hover:border-stroke-strong group-hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.14),0_0_0_1px_rgba(59,130,246,0.12),0_12px_40px_-18px_rgba(59,130,246,0.35)]',
              )}
            >
              <BrandLogo priority className="relative z-10 p-[3px]" />
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_0%,rgba(59,130,246,0.22),transparent_62%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              />
            </div>
            <div className="min-w-0 leading-none">
              <p className="truncate text-[0.8125rem] font-semibold tracking-[-0.03em] text-soft sm:text-[0.9375rem]">
                {BRAND.name}
              </p>
              <p className="mt-1 hidden truncate text-[10px] font-medium uppercase tracking-[0.18em] text-muted sm:block">
                {BRAND.tagline}
              </p>
            </div>
          </Link>

          <nav
            aria-label="Primary"
            className="hidden items-center justify-center justify-self-center md:flex"
          >
            <div className="flex items-center rounded-full border border-stroke bg-fill-glass p-1 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] backdrop-blur-md">
              {nav.map(({ href, label }) => {
                const active = pathname === href || pathname.startsWith(`${href}/`)
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      'relative rounded-full px-3.5 py-2 text-[13px] font-medium tracking-[-0.01em] transition-[color,background-color,transform] duration-300 lg:px-4',
                      active
                        ? 'text-soft'
                        : 'text-muted hover:bg-fill-glass hover:text-soft',
                    )}
                  >
                    {active ? (
                      <span
                        aria-hidden
                        className="absolute inset-0 rounded-full bg-fill-glass-strong shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
                      />
                    ) : null}
                    <span className="relative">{label}</span>
                  </Link>
                )
              })}
            </div>
          </nav>

          <div className="flex items-center justify-end gap-1.5 justify-self-end sm:gap-2 lg:gap-2.5">
            <a
              href={BRAND.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full border border-stroke bg-fill-glass text-muted shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] transition-[border-color,background-color,color] hover:border-stroke-strong hover:bg-fill-glass-strong hover:text-soft md:inline-flex"
              aria-label="WhatsApp concierge"
            >
              <MessageCircle className="h-[18px] w-[18px]" aria-hidden />
            </a>
            <ThemeToggle className="hidden md:inline-flex" />
            {ready && user ? (
              <details
                ref={accountMenuRef}
                className="relative hidden sm:block"
              >
                <summary
                  className={cn(
                    'flex cursor-pointer list-none items-center gap-1.5 rounded-full border border-stroke bg-fill-glass py-1 pl-1 pr-2 text-soft shadow-none transition-[border-color,background-color] hover:border-stroke-strong hover:bg-fill-glass-strong [&::-webkit-details-marker]:hidden',
                  )}
                  aria-label="Account menu"
                >
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- OAuth avatars (e.g. Google) not in next/image remotePatterns
                    <img
                      src={avatarUrl}
                      alt=""
                      width={32}
                      height={32}
                      className="h-8 w-8 shrink-0 rounded-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-electric/20 text-[11px] font-bold text-electric">
                      {initialsFromUser(user)}
                    </span>
                  )}
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted" aria-hidden />
                </summary>
                <div
                  className={cn(
                    'absolute right-0 top-[calc(100%+0.375rem)] z-[80] min-w-[11.5rem] overflow-hidden rounded-xl border border-stroke bg-matte/[0.96] py-1 shadow-[0_16px_48px_-20px_rgba(0,0,0,0.85)] backdrop-blur-xl',
                  )}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    disabled={signingOut}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-[13px] font-medium text-muted transition-colors hover:bg-fill-glass-strong hover:text-soft disabled:opacity-50"
                    onClick={() => void handleSignOut()}
                  >
                    <LogOut className="h-4 w-4" aria-hidden />
                    {signingOut ? 'Signing out…' : 'Sign out'}
                  </button>
                </div>
              </details>
            ) : null}
            <WhatsAppInquiryButton
              size="sm"
              className="hidden h-9 px-4 text-[13px] font-semibold shadow-[0_12px_36px_-16px_rgba(59,130,246,0.55)] hover:translate-y-0 active:translate-y-0 sm:inline-flex"
              label="WhatsApp inquiry"
            />

            <button
              type="button"
              className={cn(
                'touch-manipulation inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[0.625rem] border text-soft transition-[transform,border-color,background-color,color,box-shadow] duration-300 active:scale-[0.96] md:hidden',
                open
                  ? 'border-stroke-strong bg-fill-glass-strong shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]'
                  : 'border-stroke bg-fill-glass shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] hover:border-stroke-strong hover:bg-fill-glass-strong',
              )}
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
              aria-controls="mobile-nav"
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X className="h-[18px] w-[18px]" strokeWidth={2} /> : <Menu className="h-[18px] w-[18px]" strokeWidth={2} />}
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence mode="sync">
        {open ? (
          <>
            <motion.button
              key="nav-backdrop"
              type="button"
              aria-label="Close menu"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.28, ease }}
              className="fixed inset-0 z-[60] bg-matte/55 backdrop-blur-md md:hidden"
              onClick={() => setOpen(false)}
            />
            <motion.div
              key="nav-panel"
              id="mobile-nav"
              role="dialog"
              aria-modal="true"
              aria-label="Navigation"
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.38, ease }}
              className="fixed left-0 right-0 top-[var(--public-header-offset)] z-[70] max-h-[calc(100dvh-var(--public-header-offset))] overflow-y-auto overflow-x-hidden border-b border-stroke bg-matte/[0.92] shadow-[0_24px_80px_-32px_rgba(0,0,0,0.85)] backdrop-blur-2xl backdrop-saturate-[1.25] supports-[backdrop-filter]:bg-matte/[0.78] md:hidden"
            >
              <div className="container-app flex flex-col gap-1 py-5">
                <p className="px-1 pb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted">
                  Menu
                </p>
                {nav.map(({ href, label }, i) => {
                  const active = pathname === href || pathname.startsWith(`${href}/`)
                  return (
                    <motion.div
                      key={href}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.32, delay: 0.04 + i * 0.05, ease }}
                    >
                      <Link
                        href={href}
                        className={cn(
                          'block min-h-12 rounded-xl px-3 py-4 text-[15px] font-medium leading-snug tracking-[-0.02em] transition-[color,background-color,box-shadow] duration-200',
                          active
                            ? 'bg-fill-glass-strong text-soft shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]'
                            : 'text-muted hover:bg-fill-glass hover:text-soft',
                        )}
                        onClick={() => setOpen(false)}
                      >
                        {label}
                      </Link>
                    </motion.div>
                  )
                })}

                <div className="mt-1">
                  <ThemeToggle size="comfortable" className="w-full justify-center" />
                </div>

                <div className="mt-3">
                  <Button
                    variant="secondary"
                    size="lg"
                    href={BRAND.whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-[3.25rem] w-full border-stroke-strong bg-fill-glass-strong text-[15px] font-medium hover:translate-y-0 hover:bg-fill-glass-strong active:translate-y-0"
                    onClick={() => setOpen(false)}
                  >
                    <MessageCircle className="h-[18px] w-[18px] text-electric" aria-hidden />
                    WhatsApp
                  </Button>
                </div>

                <div className="mt-5 grid gap-3 border-t border-stroke pt-5">
                  <WhatsAppInquiryButton
                    size="lg"
                    className="min-h-[3.25rem] w-full text-[15px] font-semibold shadow-[0_16px_48px_-20px_rgba(59,130,246,0.55)]"
                    label="WhatsApp inquiry"
                    onClick={() => setOpen(false)}
                  />
                  {ready && user ? (
                    <Button
                      variant="outline"
                      size="lg"
                      className="min-h-[3.25rem] w-full text-[15px] font-medium hover:translate-y-0 active:translate-y-0"
                      disabled={signingOut}
                      onClick={() => void handleSignOut()}
                    >
                      <LogOut className="h-[18px] w-[18px]" aria-hidden />
                      {signingOut ? 'Signing out…' : 'Sign out'}
                    </Button>
                  ) : null}
                </div>
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </>
  )
}
