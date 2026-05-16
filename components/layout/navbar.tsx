'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ArrowUpRight, ChevronDown, LayoutDashboard, LogOut, Menu, X } from 'lucide-react'
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

const conciergeBtn =
  'h-auto min-h-0 rounded-none border-0 bg-transparent px-0 py-1 text-[11px] font-medium uppercase tracking-[0.22em] text-soft shadow-none transition-opacity duration-200 hover:bg-transparent hover:opacity-55 focus-visible:ring-0 focus-visible:ring-offset-0'

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
    const onScroll = () => setScrolled(window.scrollY > 8)
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
          'sticky top-0 z-50 border-b pt-[var(--safe-top)] transition-[border-color,background-color] duration-500',
          scrolled ? 'border-stroke/25 bg-matte/90' : 'border-transparent bg-matte/70',
        )}
      >
        <div
          className={cn(
            'container-app relative flex min-h-[3.75rem] items-center sm:min-h-16 lg:min-h-[4.75rem]',
            '2xl:max-w-[var(--container-wide)]',
          )}
        >
          <Link
            href="/"
            className="group flex min-w-0 shrink-0 items-center gap-3 sm:gap-4"
            onClick={() => setOpen(false)}
          >
            <BrandLogo priority className="h-8 w-8 shrink-0 sm:h-9 sm:w-9 md:h-10 md:w-10" />
            <span className="flex min-w-0 flex-col">
              <span className="text-[1.125rem] font-medium leading-none tracking-[-0.045em] text-soft sm:text-[1.25rem] lg:text-[1.4rem]">
                {BRAND.name}
              </span>
              <span className="mt-1 hidden text-[10px] font-normal uppercase tracking-[0.32em] text-muted sm:block">
                {BRAND.tagline}
              </span>
            </span>
          </Link>

          <nav
            aria-label="Primary"
            className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 md:block"
          >
            <ul className="flex items-center gap-9 lg:gap-11">
              {nav.map(({ href, label }) => {
                const active = pathname === href || pathname.startsWith(`${href}/`)
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      className={cn(
                        'border-b pb-1 text-[13px] font-medium tracking-[-0.01em] transition-colors duration-200 lg:text-[0.8125rem]',
                        active
                          ? 'border-soft text-soft'
                          : 'border-transparent text-muted hover:border-stroke/50 hover:text-soft',
                      )}
                    >
                      {label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          <div className="ml-auto flex items-center gap-3 sm:gap-4 lg:gap-6">
            <ThemeToggle className="hidden h-8 w-8 rounded-sm border-0 bg-transparent shadow-none hover:bg-fill-glass sm:inline-flex md:h-9 md:w-9" />
            {ready && !user ? (
              <Button
                variant="ghost"
                size="sm"
                to="/login"
                className="hidden h-auto min-h-0 rounded-none px-0 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-muted shadow-none hover:bg-transparent hover:text-soft sm:inline-flex"
              >
                Sign in
              </Button>
            ) : null}
            {ready && user ? (
              <details ref={accountMenuRef} className="relative hidden sm:block">
                <summary
                  className={cn(
                    'flex cursor-pointer list-none items-center gap-2 py-1 text-soft transition-opacity hover:opacity-70 [&::-webkit-details-marker]:hidden',
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
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-fill-glass text-[10px] font-semibold uppercase tracking-wider text-soft">
                      {initialsFromUser(user)}
                    </span>
                  )}
                  <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden />
                </summary>
                <div
                  className="absolute right-0 top-[calc(100%+0.5rem)] z-[80] min-w-[12rem] border-l border-stroke/35 bg-matte py-2 pl-4 pr-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Link
                    href="/dashboard"
                    className="flex w-full items-center gap-2 py-2.5 text-[13px] font-medium text-muted transition-colors hover:text-soft"
                    onClick={() => accountMenuRef.current?.removeAttribute('open')}
                  >
                    <LayoutDashboard className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
                    Dashboard
                  </Link>
                  <button
                    type="button"
                    disabled={signingOut}
                    className="flex w-full items-center gap-2 py-2.5 text-left text-[13px] font-medium text-muted transition-colors hover:text-soft disabled:opacity-50"
                    onClick={() => void handleSignOut()}
                  >
                    <LogOut className="h-4 w-4 opacity-70" aria-hidden />
                    {signingOut ? 'Signing out…' : 'Sign out'}
                  </button>
                </div>
              </details>
            ) : null}
            <WhatsAppInquiryButton
              size="sm"
              variant="ghost"
              showIcon={false}
              className={cn(conciergeBtn, 'hidden sm:inline-flex')}
              label="WhatsApp concierge"
            >
              <span className="flex items-center gap-1">
                Concierge
                <ArrowUpRight className="h-3.5 w-3.5 opacity-70" strokeWidth={2} aria-hidden />
              </span>
            </WhatsAppInquiryButton>

            <button
              type="button"
              className={cn(
                'touch-manipulation inline-flex h-11 w-11 shrink-0 items-center justify-center text-soft md:hidden',
              )}
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
              aria-controls="mobile-nav"
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X className="h-5 w-5" strokeWidth={1.5} /> : <Menu className="h-5 w-5" strokeWidth={1.5} />}
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
              transition={{ duration: 0.2, ease }}
              className="fixed inset-0 z-[60] bg-matte/80 md:hidden"
              onClick={() => setOpen(false)}
            />
            <motion.div
              key="nav-panel"
              id="mobile-nav"
              role="dialog"
              aria-modal="true"
              aria-label="Navigation"
              initial={{ opacity: 0.97, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease }}
              className="fixed left-0 right-0 top-[var(--public-header-offset)] z-[70] max-h-[calc(100dvh-var(--public-header-offset))] overflow-y-auto bg-matte md:hidden"
            >
              <div className="container-app flex flex-col pb-12 pt-8">
                <nav aria-label="Mobile primary" className="flex flex-col">
                  {nav.map(({ href, label }, i) => {
                    const active = pathname === href || pathname.startsWith(`${href}/`)
                    return (
                      <motion.div
                        key={href}
                        initial={{ opacity: 0.92, x: -4 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.25, delay: i * 0.04, ease }}
                      >
                        <Link
                          href={href}
                          className={cn(
                            'block border-b border-stroke/35 py-5 text-[1.65rem] font-medium leading-none tracking-[-0.035em]',
                            active ? 'text-soft' : 'text-muted',
                          )}
                          onClick={() => setOpen(false)}
                        >
                          {label}
                        </Link>
                      </motion.div>
                    )
                  })}
                </nav>

                <div className="mt-10 border-b border-stroke/35 pb-10">
                  <ThemeToggle size="comfortable" className="w-full justify-center rounded-none border-stroke/40 bg-transparent shadow-none" />
                </div>

                <div className="mt-10 space-y-6">
                  <WhatsAppInquiryButton
                    size="lg"
                    variant="ghost"
                    showIcon={false}
                    className={cn(conciergeBtn, 'w-full justify-start py-3 text-left text-[12px]')}
                    label="WhatsApp concierge"
                    onClick={() => setOpen(false)}
                  >
                    <span className="flex w-full items-center justify-between gap-3">
                      <span className="flex flex-col items-start gap-1">
                        <span>Reserve with concierge</span>
                        <span className="text-[11px] font-normal normal-case tracking-normal text-muted">
                          WhatsApp · same-day response when available
                        </span>
                      </span>
                      <ArrowUpRight className="h-5 w-5 shrink-0 opacity-60" strokeWidth={1.5} />
                    </span>
                  </WhatsAppInquiryButton>
                </div>

                <div className="mt-12 flex flex-col gap-4 border-t border-stroke/35 pt-10">
                  {ready ? (
                    user ? (
                      <>
                        <Button
                          variant="ghost"
                          size="lg"
                          to="/dashboard"
                          className="h-auto min-h-0 justify-start rounded-none border-0 bg-transparent px-0 py-3 text-left text-[15px] font-medium text-soft shadow-none hover:bg-transparent"
                          onClick={() => setOpen(false)}
                        >
                          Dashboard
                        </Button>
                        <button
                          type="button"
                          className="py-3 text-left text-[15px] font-medium text-muted transition-colors hover:text-soft disabled:opacity-50"
                          disabled={signingOut}
                          onClick={() => void handleSignOut()}
                        >
                          {signingOut ? 'Signing out…' : 'Sign out'}
                        </button>
                      </>
                    ) : (
                      <Link
                        href="/login"
                        className="py-3 text-[15px] font-medium text-soft"
                        onClick={() => setOpen(false)}
                      >
                        Sign in
                      </Link>
                    )
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
