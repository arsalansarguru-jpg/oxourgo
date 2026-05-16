'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ChevronDown, LayoutDashboard, LogOut, Settings } from 'lucide-react'
import type { User } from '@supabase/supabase-js'

import { DashboardNotificationBell } from '@/features/dashboard/dashboard-notification-bell'
import { BrandLogo } from '@/components/layout/brand-logo'
import { ThemeToggle } from '@/components/layout/theme-toggle'
import { useSupabase } from '@/hooks/use-supabase'
import { useSupabaseAuthUser } from '@/hooks/use-supabase-auth-user'
import type { NotificationRow } from '@/lib/supabase/database.types'
import { cn } from '@/lib/utils/cn'

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

export type DashboardTopBarProps = {
  userId: string
  notificationUnread: number
  notificationPreview: NotificationRow[]
}

export function DashboardTopBar({ userId, notificationUnread, notificationPreview }: DashboardTopBarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = useSupabase()
  const { user, ready } = useSupabaseAuthUser()
  const accountMenuRef = useRef<HTMLDetailsElement>(null)
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => {
    accountMenuRef.current?.removeAttribute('open')
  }, [pathname])

  async function handleSignOut() {
    if (!supabase || signingOut) return
    setSigningOut(true)
    try {
      await supabase.auth.signOut()
      accountMenuRef.current?.removeAttribute('open')
      router.refresh()
      router.push('/')
    } finally {
      setSigningOut(false)
    }
  }

  const avatarUrl = user ? avatarUrlFromUser(user) : null

  return (
    <header className="sticky top-0 z-50 border-b border-stroke bg-carbon pt-[var(--safe-top)]">
      <div className="container-app flex min-h-14 items-center justify-between gap-3 lg:min-h-16">
        <Link href="/dashboard" className="flex min-w-0 shrink-0 items-center gap-2" aria-label="Oxour Go dashboard home">
          <BrandLogo priority className="h-8 w-auto max-w-[7rem]" />
        </Link>

        <div className="flex min-w-0 items-center justify-end gap-2">
          <DashboardNotificationBell
            userId={userId}
            initialUnread={notificationUnread}
            initialPreview={notificationPreview}
          />
          <ThemeToggle className="hidden sm:inline-flex" />
          {ready && user ? (
            <details ref={accountMenuRef} className="relative">
              <summary
                className={cn(
                  'flex cursor-pointer list-none items-center gap-1.5 rounded-md border border-stroke bg-carbon py-1 pl-1 pr-2 text-soft [&::-webkit-details-marker]:hidden',
                )}
                aria-label="Account menu"
              >
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt=""
                    width={32}
                    height={32}
                    className="h-8 w-8 shrink-0 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-carbon-deep text-xs font-medium text-soft">
                    {initialsFromUser(user)}
                  </span>
                )}
                <ChevronDown className="h-4 w-4 shrink-0 text-muted" aria-hidden />
              </summary>
              <div
                className="absolute right-0 top-[calc(100%+0.25rem)] z-[80] min-w-[11.5rem] rounded-lg border border-stroke bg-carbon py-1 shadow-[var(--shadow-card-hover)]"
                onClick={(e) => e.stopPropagation()}
              >
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 px-3 py-2.5 text-sm text-soft hover:bg-fill-glass"
                  onClick={() => accountMenuRef.current?.removeAttribute('open')}
                >
                  <LayoutDashboard className="h-4 w-4 text-muted" aria-hidden />
                  Overview
                </Link>
                <Link
                  href="/dashboard/settings"
                  className="flex items-center gap-2 px-3 py-2.5 text-sm text-soft hover:bg-fill-glass"
                  onClick={() => accountMenuRef.current?.removeAttribute('open')}
                >
                  <Settings className="h-4 w-4 text-muted" aria-hidden />
                  Profile
                </Link>
                <button
                  type="button"
                  disabled={signingOut}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-muted hover:bg-fill-glass hover:text-soft disabled:opacity-50"
                  onClick={() => void handleSignOut()}
                >
                  <LogOut className="h-4 w-4" aria-hidden />
                  {signingOut ? 'Signing out…' : 'Sign out'}
                </button>
              </div>
            </details>
          ) : null}
        </div>
      </div>
    </header>
  )
}
