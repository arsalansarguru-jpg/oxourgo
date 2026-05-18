'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ChevronDown, LayoutDashboard, LogOut, Menu, X } from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import { BRAND } from '@/constants/brand'
import { useSupabase } from '@/hooks/use-supabase'
import { useSupabaseAuthUser } from '@/hooks/use-supabase-auth-user'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/Button'
import { BrandLogo } from '@/components/layout/brand-logo'
import { ThemeToggle } from '@/components/layout/theme-toggle'

import { PUBLIC_EXTRA_NAV, SITE_PRIMARY_NAV } from '@/lib/nav/site-nav'

const nav = [
  ...SITE_PRIMARY_NAV.map(({ href, label }) => ({ href, label })),
  ...PUBLIC_EXTRA_NAV,
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
      <header className="sticky top-0 z-50 border-b border-stroke bg-carbon/88 pt-[var(--safe-top)] shadow-[0_18px_60px_-48px_rgba(0,0,0,0.7)] backdrop-blur-xl">
        <div className="container-app flex min-h-[var(--public-header-inner-h)] items-center justify-between gap-4">
          <Link href="/" className="flex min-w-0 items-center gap-2" onClick={() => setOpen(false)}>
            <BrandLogo priority className="h-8 w-auto max-w-[7.5rem] shrink-0 sm:max-w-[8.5rem]" />
            <span className="sr-only">{BRAND.name}</span>
          </Link>

          <nav aria-label="Primary" className="hidden md:block">
            <ul className="flex items-center gap-1">
              {nav.map(({ href, label }) => {
                const active =
                  href === '/'
                    ? pathname === '/'
                    : pathname === href || pathname.startsWith(`${href}/`)
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      className={cn(
                        'rounded-full px-3.5 py-2 text-sm font-semibold transition-colors',
                        active ? 'bg-fill-glass-strong text-soft' : 'text-muted hover:bg-fill-glass hover:text-soft',
                      )}
                    >
                      {label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle className="hidden sm:inline-flex" />
            {ready && !user ? (
              <Button variant="ghost" size="sm" to="/login" className="hidden sm:inline-flex">
                Sign in
              </Button>
            ) : null}
            <Button size="sm" to="/fleet" className="hidden sm:inline-flex">
              Browse fleet
            </Button>
            {ready && user ? (
              <details ref={accountMenuRef} className="relative hidden sm:block">
                <summary
                  className="flex cursor-pointer list-none items-center gap-2 rounded-md px-1 py-1 [&::-webkit-details-marker]:hidden"
                  aria-label="Account"
                >
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarUrl} alt="" width={32} height={32} className="h-8 w-8 rounded-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <span className="flex h-8 w-8 items-center justify-center rounded-full border border-stroke bg-carbon-deep text-xs font-medium text-soft">
                      {initialsFromUser(user)}
                    </span>
                  )}
                  <ChevronDown className="h-4 w-4 text-muted" aria-hidden />
                </summary>
                <div className="absolute right-0 top-full z-[80] mt-2 min-w-[11rem] rounded-2xl border border-stroke bg-carbon py-1 shadow-[var(--shadow-card-hover)]">
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2 px-3 py-2 text-sm text-soft hover:bg-fill-glass"
                    onClick={() => accountMenuRef.current?.removeAttribute('open')}
                  >
                    <LayoutDashboard className="h-4 w-4 text-muted" aria-hidden />
                    Dashboard
                  </Link>
                  <button
                    type="button"
                    disabled={signingOut}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-soft hover:bg-fill-glass disabled:opacity-50"
                    onClick={() => void handleSignOut()}
                  >
                    <LogOut className="h-4 w-4 text-muted" aria-hidden />
                    {signingOut ? 'Signing out…' : 'Sign out'}
                  </button>
                </div>
              </details>
            ) : null}
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-stroke text-soft md:hidden"
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {open ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-soft/20"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-x-0 top-[var(--public-header-offset)] max-h-[calc(100dvh-var(--public-header-offset))] overflow-y-auto border-b border-stroke bg-carbon/96 shadow-[var(--shadow-card-hover)] backdrop-blur-xl">
            <div className="container-app space-y-1 py-3">
              {nav.map(({ href, label }) => {
                const active =
                  href === '/'
                    ? pathname === '/'
                    : pathname === href || pathname.startsWith(`${href}/`)
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      'block rounded-2xl px-3 py-3 text-base font-semibold',
                      active ? 'bg-fill-glass text-soft' : 'text-muted',
                    )}
                    onClick={() => setOpen(false)}
                  >
                    {label}
                  </Link>
                )
              })}
              <div className="space-y-2 border-t border-stroke pt-4">
                <ThemeToggle size="comfortable" className="w-full justify-center" />
                <Button size="lg" to="/fleet" className="w-full" onClick={() => setOpen(false)}>
                  Browse fleet
                </Button>
                {ready ? (
                  user ? (
                    <>
                      <Button variant="secondary" size="lg" to="/dashboard" className="w-full" onClick={() => setOpen(false)}>
                        Dashboard
                      </Button>
                      <Button variant="ghost" size="lg" className="w-full" disabled={signingOut} onClick={() => void handleSignOut()}>
                        {signingOut ? 'Signing out…' : 'Sign out'}
                      </Button>
                    </>
                  ) : (
                    <Button variant="outline" size="lg" to="/login" className="w-full" onClick={() => setOpen(false)}>
                      Sign in
                    </Button>
                  )
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
