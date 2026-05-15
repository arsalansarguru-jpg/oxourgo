import { LockKeyhole, ShieldAlert } from 'lucide-react'

import { RoleBadge } from '@/components/auth/role-badge'
import { Button } from '@/components/ui/Button'
import type { AppAuthRole } from '@/lib/auth/roles'
import { cn } from '@/lib/utils/cn'

export type PermissionDeniedProps = {
  title?: string
  description?: string
  appRole?: AppAuthRole
  fromPath?: string | null
  className?: string
}

export function PermissionDenied({
  title = 'Access restricted',
  description = 'Your role does not include permission for this area. Contact an operations administrator if you need expanded access.',
  appRole,
  fromPath,
  className,
}: PermissionDeniedProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-white/[0.06] via-[#0a0a0c] to-[#050506] p-8 sm:p-12 shadow-[0_24px_80px_-40px_rgba(0,0,0,0.85)]',
        className,
      )}
    >
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-electric/10 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -bottom-20 -left-12 h-56 w-56 rounded-full bg-amber-500/5 blur-3xl" />

      <div className="relative flex flex-col items-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/[0.1] bg-white/[0.04] shadow-[0_0_40px_-12px_rgba(59,130,246,0.45)]">
          <ShieldAlert className="h-8 w-8 text-electric" aria-hidden />
        </div>

        <h1 className="mt-8 text-2xl font-semibold tracking-[-0.04em] text-soft sm:text-3xl">{title}</h1>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">{description}</p>

        {appRole ? (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs text-muted">Signed in as</span>
            <RoleBadge role={appRole} size="md" />
          </div>
        ) : null}

        {fromPath ? (
          <p className="mt-4 font-mono text-[11px] text-muted/80">
            <LockKeyhole className="mr-1.5 inline h-3 w-3 align-[-2px]" aria-hidden />
            {fromPath}
          </p>
        ) : null}

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Button to="/admin" variant="primary">
            Back to admin home
          </Button>
          <Button to="/dashboard" variant="ghost">
            Member dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}
