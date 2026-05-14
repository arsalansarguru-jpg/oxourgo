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
    <header
      className={cn(
        'sticky top-0 z-50 border-b border-stroke bg-matte/[0.78] shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset] backdrop-blur-2xl supports-[backdrop-filter]:bg-matte/[0.62]',
      )}
    >
      <div className="container-app flex h-14 items-center justify-between gap-3 lg:h-[3.75rem]">
        <Link href="/dashboard" className="flex shrink-0 items-center gap-2" aria-label="Oxour Go dashboard home">
          <span className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-[0.6875rem] border border-stroke bg-gradient-to-b from-fill-glass-strong to-fill-glass shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)]">
            <BrandLogo priority className="relative z-10 p-[3px]" />
          </span>
        </Link>

        <div className="flex items-center justify-end gap-1.5 sm:gap-2">
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
                  'flex cursor-pointer list-none items-center gap-1.5 rounded-full border border-stroke bg-fill-glass py-1 pl-1 pr-2 text-soft [&::-webkit-details-marker]:hidden',
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
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-electric/20 text-[11px] font-bold text-electric">
                    {initialsFromUser(user)}
                  </span>
                )}
                <ChevronDown className="h-4 w-4 shrink-0 text-muted" aria-hidden />
              </summary>
              <div
                className="absolute right-0 top-[calc(100%+0.375rem)] z-[80] min-w-[11.5rem] overflow-hidden rounded-xl border border-stroke bg-matte/[0.96] py-1 shadow-[0_16px_48px_-20px_rgba(0,0,0,0.85)] backdrop-blur-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 px-3 py-2.5 text-[13px] font-medium text-soft transition-colors hover:bg-fill-glass-strong"
                  onClick={() => accountMenuRef.current?.removeAttribute('open')}
                >
                  <LayoutDashboard className="h-4 w-4 text-electric/90" aria-hidden />
                  Overview
                </Link>
                <Link
                  href="/dashboard/settings"
                  className="flex items-center gap-2 px-3 py-2.5 text-[13px] font-medium text-soft transition-colors hover:bg-fill-glass-strong"
                  onClick={() => accountMenuRef.current?.removeAttribute('open')}
                >
                  <Settings className="h-4 w-4 text-electric/90" aria-hidden />
                  Profile
                </Link>
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
        </div>
      </div>
    </header>
  )
}
