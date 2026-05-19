import { LockKeyhole, ShieldAlert } from 'lucide-react'

import { RoleBadge } from '@/components/auth/role-badge'
import { BrandLogo } from '@/components/layout/brand-logo'
import { Button } from '@/components/ui/Button'
import type { AppAuthRole } from '@/lib/auth/roles'

export type AdminNoAccessViewProps = {
  email?: string
  appRole: AppAuthRole
  fromPath?: string | null
}

/**
 * Admin-themed "no admin access" view shown when an authenticated but non-staff
 * user lands on any `/admin/*` route. This intentionally does NOT use AdminShell
 * (no admin sidebar / topbar) and never falls back to the customer dashboard UI.
 */
export function AdminNoAccessView({ email, appRole, fromPath }: AdminNoAccessViewProps) {
  return (
    <div className="flex min-h-dvh min-w-0 bg-[#080706] text-soft [--color-electric:#3b82f6] [--color-matte:#080706] [--color-muted:#a99b88] [--color-soft:#f8f2e8] [--color-stroke:rgb(255_255_255/0.09)]">
      <main className="flex flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-white/[0.08] bg-[#0d0a07]/88 px-4 backdrop-blur-xl sm:px-6">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <BrandLogo variant="lockup" className="h-8 w-auto max-w-[7rem] shrink-0" />
            <h1 className="truncate font-display text-base font-semibold text-soft">Admin · Access</h1>
          </div>
        </header>

        <div className="flex flex-1 items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(201,154,85,0.14),transparent_28rem),linear-gradient(180deg,#080706,#0c0906)] px-4 py-10 sm:py-14">
          <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-white/[0.06] via-[#0a0a0c] to-[#050506] p-6 shadow-[0_24px_80px_-40px_rgba(0,0,0,0.85)] sm:p-10">
            <div
              className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-electric/10 blur-3xl"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -bottom-20 -left-12 h-56 w-56 rounded-full bg-amber-500/5 blur-3xl"
              aria-hidden
            />

            <div className="relative flex flex-col items-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.1] bg-white/[0.04] shadow-[0_0_40px_-12px_rgba(59,130,246,0.45)] sm:h-16 sm:w-16">
                <ShieldAlert className="h-7 w-7 text-electric sm:h-8 sm:w-8" aria-hidden />
              </div>

              <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.22em] text-electric/90">
                Admin console
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-soft sm:text-3xl">
                You don&rsquo;t have admin access
              </h2>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
                This account is signed in, but the role assigned to it doesn&rsquo;t include any admin permissions.
                Ask an operations administrator to grant the right role, then reload this page.
              </p>

              <div className="mt-6 flex flex-col items-center gap-2">
                {email ? (
                  <p className="font-mono text-[11px] text-muted/80 break-all">{email}</p>
                ) : null}
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <span className="text-xs text-muted">Signed in as</span>
                  <RoleBadge role={appRole} size="md" />
                </div>
                {fromPath ? (
                  <p className="mt-1 font-mono text-[11px] text-muted/70">
                    <LockKeyhole className="mr-1.5 inline h-3 w-3 align-[-2px]" aria-hidden />
                    {fromPath}
                  </p>
                ) : null}
              </div>

              <div className="mt-8 flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
                <Button type="button" to="/" variant="secondary" className="min-h-11 w-full sm:w-auto">
                  Back to site
                </Button>
                <Button type="button" to="/login" variant="ghost" className="min-h-11 w-full sm:w-auto">
                  Switch account
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
