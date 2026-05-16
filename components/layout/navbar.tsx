'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ChevronDown, LayoutDashboard, LogOut, Menu, X } from 'lucide-react'
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
    return (a + b).toUpperCase() || a.toUpperCase() || '?'
  }
  return (user.email ?? '').slice(0, 2).toUpperCase() || '?'
}

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = useSupabase()
  const { user, ready } = useSupabaseAuthUser()
  const accountMenuRef = useRef<HTMLDetailsElement>(null)
  const [open, setOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  const avatarUrl = user ? avatarUrlFromUser(user) : null

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
      <header className="sticky top-0 z-50 border-b border-stroke bg-matte pt-[var(--safe-top)]">
        <div className="container-app flex min-h-[var(--public-header-inner-h)] items-center justify-between gap-4">
          <Link href="/" className="flex min-w-0 items-center gap-3" onClick={() => setOpen(false)}>
            <BrandLogo priority className="h-8 w-8 shrink-0" />
            <span className="truncate text-base font-semibold tracking-tight text-soft">{BRAND.name}</span>
          </Link>

          <nav aria-label="Primary" className="hidden md:block">
            <ul className="flex items-center gap-8">
              {nav.map(({ href, label }) => {
                const active = pathname === href || pathname.startsWith(`${href}/`)
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      className={cn(
                        'text-sm font-medium transition-colors',
                        active ? 'text-soft' : 'text-muted hover:text-soft',
                      )}
                    >
                      {label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle className="hidden sm:inline-flex" />
            {ready && !user ? (
              <Button variant="ghost" size="sm" to="/login" className="hidden sm:inline-flex">
                Sign in
              </Button>
            ) : null}
            {ready && user ? (
              <details ref={accountMenuRef} className="relative hidden sm:block">
                <summary
                  className="flex cursor-pointer list-none items-center gap-2 [&::-webkit-details-marker]:hidden"
                  aria-label="Account"
                >
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarUrl} alt="" width={32} height={32} className="h-8 w-8 rounded-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-fill-glass text-xs font-semibold text-soft">
                      {initialsFromUser(user)}
                    </span>
                  )}
                  <ChevronDown className="h-4 w-4 text-muted" aria-hidden />
                </summary>
                <div className="absolute right-0 top-full z-[80] mt-2 min-w-[11rem] rounded-xl border border-stroke bg-carbon py-1">
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-muted hover:bg-fill-glass hover:text-soft"
                    onClick={() => accountMenuRef.current?.removeAttribute('open')}
                  >
                    <LayoutDashboard className="h-4 w-4" aria-hidden />
                    Dashboard
                  </Link>
                  <button
                    type="button"
                    disabled={signingOut}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-muted hover:bg-fill-glass hover:text-soft disabled:opacity-50"
                    onClick={() => void handleSignOut()}
                  >
                    <LogOut className="h-4 w-4" aria-hidden />
                    {signingOut ? 'Signing out…' : 'Sign out'}
                  </button>
                </div>
              </details>
            ) : null}
            <WhatsAppInquiryButton size="sm" className="hidden md:inline-flex" label="Concierge" />
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-stroke text-soft md:hidden"
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {open ? (
          <>
            <motion.button
              type="button"
              aria-label="Close menu"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-matte/80 md:hidden"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="fixed inset-x-0 top-[var(--public-header-offset)] z-[70] max-h-[calc(100dvh-var(--public-header-offset))] overflow-y-auto border-b border-stroke bg-matte md:hidden"
            >
              <div className="container-app space-y-1 py-4">
                {nav.map(({ href, label }) => {
                  const active = pathname === href || pathname.startsWith(`${href}/`)
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={cn(
                        'block rounded-lg px-3 py-3.5 text-base font-medium',
                        active ? 'bg-fill-glass text-soft' : 'text-muted',
                      )}
                      onClick={() => setOpen(false)}
                    >
                      {label}
                    </Link>
                  )
                })}
                <div className="border-t border-stroke pt-4">
                  <ThemeToggle size="comfortable" className="mb-3 w-full justify-center" />
                  <WhatsAppInquiryButton size="lg" className="w-full" label="WhatsApp concierge" onClick={() => setOpen(false)} />
                  {ready ? (
                    user ? (
                      <div className="mt-3 space-y-2">
                        <Button variant="secondary" size="lg" to="/dashboard" className="w-full" onClick={() => setOpen(false)}>
                          Dashboard
                        </Button>
                        <Button variant="ghost" size="lg" className="w-full" disabled={signingOut} onClick={() => void handleSignOut()}>
                          {signingOut ? 'Signing out…' : 'Sign out'}
                        </Button>
                      </div>
                    ) : (
                      <Button variant="outline" size="lg" to="/login" className="mt-3 w-full" onClick={() => setOpen(false)}>
                        Sign in
                      </Button>
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
