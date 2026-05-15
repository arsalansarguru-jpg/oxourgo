'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useMemo, useTransition } from 'react'
import { Filter, X } from 'lucide-react'

import { cn } from '@/lib/utils/cn'

type Props = {
  actions: string[]
  actors: { id: string; email: string | null }[]
  entityTypes: string[]
}

export function AdminAuditFilters({ actions, actors, entityTypes }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()

  const current = useMemo(
    () => ({
      action: searchParams.get('action') ?? '',
      actor: searchParams.get('actor') ?? '',
      entityType: searchParams.get('entityType') ?? '',
      entityId: searchParams.get('entityId') ?? '',
      from: searchParams.get('from') ?? '',
      to: searchParams.get('to') ?? '',
    }),
    [searchParams],
  )

  const hasFilters = Object.values(current).some(Boolean)

  const apply = useCallback(
    (updates: Partial<typeof current>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries({ ...current, ...updates })) {
        if (value) params.set(key, value)
        else params.delete(key)
      }
      startTransition(() => {
        router.push(`/admin/audit?${params.toString()}`)
      })
    },
    [current, router, searchParams],
  )

  const clearAll = () => {
    startTransition(() => router.push('/admin/audit'))
  }

  return (
    <div
      className={cn(
        'rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 shadow-[var(--shadow-card)]',
        pending && 'opacity-70',
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-medium text-soft">
          <Filter className="h-4 w-4 text-muted" />
          Filters
        </div>
        {hasFilters ? (
          <button
            type="button"
            onClick={clearAll}
            className="inline-flex items-center gap-1 text-xs text-muted hover:text-soft"
          >
            <X className="h-3 w-3" />
            Clear
          </button>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <label className="space-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">Action</span>
          <select
            value={current.action}
            onChange={(e) => apply({ action: e.target.value })}
            className="w-full rounded-xl border border-white/[0.1] bg-black/30 px-3 py-2 text-sm text-soft outline-none focus:border-electric/40"
          >
            <option value="">All actions</option>
            {actions.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">Actor</span>
          <select
            value={current.actor}
            onChange={(e) => apply({ actor: e.target.value })}
            className="w-full rounded-xl border border-white/[0.1] bg-black/30 px-3 py-2 text-sm text-soft outline-none focus:border-electric/40"
          >
            <option value="">All actors</option>
            {actors.map((a) => (
              <option key={a.id} value={a.id}>
                {a.email ?? a.id.slice(0, 8)}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">Entity type</span>
          <select
            value={current.entityType}
            onChange={(e) => apply({ entityType: e.target.value })}
            className="w-full rounded-xl border border-white/[0.1] bg-black/30 px-3 py-2 text-sm text-soft outline-none focus:border-electric/40"
          >
            <option value="">All types</option>
            {entityTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">Entity ID</span>
          <input
            type="text"
            value={current.entityId}
            onChange={(e) => apply({ entityId: e.target.value })}
            placeholder="UUID or ID"
            className="w-full rounded-xl border border-white/[0.1] bg-black/30 px-3 py-2 text-sm text-soft outline-none placeholder:text-muted/50 focus:border-electric/40"
          />
        </label>

        <label className="space-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">From</span>
          <input
            type="date"
            value={current.from}
            onChange={(e) => apply({ from: e.target.value ? `${e.target.value}T00:00:00.000Z` : '' })}
            className="w-full rounded-xl border border-white/[0.1] bg-black/30 px-3 py-2 text-sm text-soft outline-none focus:border-electric/40"
          />
        </label>

        <label className="space-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">To</span>
          <input
            type="date"
            value={current.to ? current.to.slice(0, 10) : ''}
            onChange={(e) => apply({ to: e.target.value ? `${e.target.value}T23:59:59.999Z` : '' })}
            className="w-full rounded-xl border border-white/[0.1] bg-black/30 px-3 py-2 text-sm text-soft outline-none focus:border-electric/40"
          />
        </label>
      </div>
    </div>
  )
}
