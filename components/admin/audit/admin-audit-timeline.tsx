'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils/cn'
import { formatAuditValueChange, getAuditPresentation } from '@/lib/audit/labels'
import type { AuditLogRow } from '@/lib/admin/data/audit-logs'

type ActorLookup = Record<string, { email: string | null; roleLabel?: string }>

type Props = {
  entries: AuditLogRow[]
  actorLookup?: ActorLookup
  compact?: boolean
  showEntityLinks?: boolean
  className?: string
}

const TONE_RING: Record<string, string> = {
  default: 'border-white/20 bg-white/[0.06] text-soft',
  success: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200',
  warn: 'border-amber-400/30 bg-amber-500/10 text-amber-200',
  danger: 'border-rose-400/30 bg-rose-500/10 text-rose-200',
  accent: 'border-electric/30 bg-electric/10 text-electric',
}

function entityHref(entityType: string, entityId: string | null): string | null {
  if (!entityId) return null
  if (entityType === 'booking') return `/admin/bookings/${entityId}`
  if (entityType === 'profile' || entityType === 'user') return `/admin/customers/${entityId}`
  if (entityType === 'vehicle' || entityType === 'fleet') return `/admin/fleet/${entityId}`
  if (entityType === 'kyc') return `/admin/kyc/review/${entityId}`
  return null
}

function metaRecord(metadata: AuditLogRow['metadata']): Record<string, unknown> | null {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return null
  return metadata as Record<string, unknown>
}

export function AdminAuditTimeline({
  entries,
  actorLookup = {},
  compact = false,
  showEntityLinks = true,
  className,
}: Props) {
  if (entries.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.02] px-4 py-8 text-center text-sm text-muted">
        No activity recorded yet.
      </p>
    )
  }

  return (
    <ol className={cn('relative space-y-0', className)}>
      <div
        className="absolute left-[15px] top-2 bottom-2 w-px bg-gradient-to-b from-white/20 via-white/10 to-transparent sm:left-[17px]"
        aria-hidden
      />
      {entries.map((entry, index) => {
        const meta = metaRecord(entry.metadata)
        const presentation = getAuditPresentation(entry.action, meta)
        const Icon = presentation.icon
        const change = formatAuditValueChange(entry.oldValue, entry.newValue)
        const actor = entry.actorId ? actorLookup[entry.actorId] : undefined
        const actorLabel =
          actor?.email?.split('@')[0] ??
          (entry.actorRole ? entry.actorRole.replace(/_/g, ' ') : null) ??
          (entry.actorId ? `${entry.actorId.slice(0, 8)}…` : 'System')
        const href = showEntityLinks ? entityHref(entry.entityType, entry.entityId) : null
        const bookingId =
          entry.entityType === 'booking' && entry.entityId
            ? entry.entityId
            : typeof meta?.bookingId === 'string'
              ? meta.bookingId
              : null

        return (
          <li
            key={entry.id}
            className={cn(
              'relative flex gap-3 sm:gap-4',
              compact ? 'py-2.5' : 'py-3.5',
              index < entries.length - 1 && 'border-b border-white/[0.04]',
            )}
          >
            <div
              className={cn(
                'relative z-[1] flex h-8 w-8 shrink-0 items-center justify-center rounded-full border sm:h-9 sm:w-9',
                TONE_RING[presentation.tone] ?? TONE_RING.default,
              )}
            >
              <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden />
            </div>

            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                <div>
                  <p className={cn('font-medium text-soft', compact ? 'text-sm' : 'text-[15px]')}>
                    {presentation.title}
                  </p>
                  <p className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.12em] text-muted/80">
                    {presentation.category}
                  </p>
                </div>
                <time
                  dateTime={entry.createdAt}
                  className="shrink-0 text-[11px] tabular-nums text-muted"
                  title={new Date(entry.createdAt).toLocaleString()}
                >
                  {formatRelativeTime(entry.createdAt)}
                </time>
              </div>

              {presentation.description ? (
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{presentation.description}</p>
              ) : null}

              {change ? (
                <p className="mt-1.5 rounded-lg border border-white/[0.06] bg-black/20 px-2.5 py-1.5 font-mono text-[11px] text-muted">
                  {change}
                </p>
              ) : null}

              <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted">
                <span>
                  <span className="text-muted/60">By </span>
                  <span className="text-soft/90">{actorLabel}</span>
                  {entry.actorRole && actor?.email ? (
                    <span className="text-muted/50"> · {entry.actorRole.replace(/_/g, ' ')}</span>
                  ) : null}
                </span>
                {href ? (
                  <>
                    <span className="text-muted/30">·</span>
                    <Link href={href} className="font-medium text-electric hover:underline">
                      View {entry.entityType}
                    </Link>
                  </>
                ) : null}
                {bookingId && entry.entityType !== 'booking' ? (
                  <>
                    <span className="text-muted/30">·</span>
                    <Link
                      href={`/admin/bookings/${bookingId}`}
                      className="font-medium text-electric hover:underline"
                    >
                      Booking
                    </Link>
                  </>
                ) : null}
              </div>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

function formatRelativeTime(iso: string): string {
  const date = new Date(iso)
  const now = Date.now()
  const diff = now - date.getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  })
}
