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
    <div className="flex min-h-dvh min-w-0 bg-matte text-soft">
      <main className="flex flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-stroke bg-carbon/90 px-4 backdrop-blur-2xl sm:px-6">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <BrandLogo variant="lockup" className="h-8 w-auto max-w-[7rem] shrink-0" />
            <h1 className="truncate font-display text-base font-bold text-soft">Admin · Access</h1>
          </div>
        </header>

        <div className="flex flex-1 items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(0,102,255,0.14),transparent_28rem),linear-gradient(180deg,var(--color-matte),var(--color-carbon))] px-4 py-10 sm:py-14">
          <div className="glass-panel relative w-full max-w-lg overflow-hidden rounded-3xl p-6 sm:p-10">
            <div
              className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-electric/15 blur-3xl"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -bottom-20 -left-12 h-56 w-56 rounded-full bg-cyan/10 blur-3xl"
              aria-hidden
            />

            <div className="relative flex flex-col items-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-stroke bg-fill-glass shadow-[var(--shadow-glow)] sm:h-16 sm:w-16">
                <ShieldAlert className="h-7 w-7 text-electric sm:h-8 sm:w-8" aria-hidden />
              </div>

              <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan">
                Admin console
              </p>
              <h2 className="mt-3 font-display text-2xl font-bold tracking-tight text-soft sm:text-3xl">
                Access denied
              </h2>
              <p className="mt-3 max-w-sm text-sm font-medium leading-relaxed text-silver">
                Your account is signed in as a customer. Operations staff permissions are required to use the admin
                console.
              </p>

              {email ? (
                <p className="mt-4 text-xs font-semibold text-muted">
                  Signed in as <span className="text-soft">{email}</span>
                </p>
              ) : null}

              <div className="mt-4">
                <RoleBadge role={appRole} />
              </div>

              {fromPath ? (
                <p className="mt-4 text-xs font-medium text-muted">
                  Requested: <span className="font-mono text-silver">{fromPath}</span>
                </p>
              ) : null}

              <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
                <Button to="/dashboard" variant="primary" className="w-full sm:w-auto">
                  <LockKeyhole className="h-4 w-4" aria-hidden />
                  Go to member dashboard
                </Button>
                <Button to="/" variant="secondary" className="w-full sm:w-auto">
                  Back to website
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
