'use client'

import { useEffect, useState } from 'react'

import { useAdminAnalyticsFilters } from '@/hooks/use-admin-analytics-filters'
import type { AnalyticsPresetId, AnalyticsResolvedRange } from '@/lib/admin/analytics-range'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/Button'

const PRESETS: { id: Exclude<AnalyticsPresetId, 'custom'>; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: '7d', label: '7D' },
  { id: '30d', label: '30D' },
  { id: '90d', label: '90D' },
]

export function AnalyticsRangeFilter({ range }: { range: AnalyticsResolvedRange }) {
  const { isPending, navigatePreset, navigateCustom } = useAdminAnalyticsFilters()
  const [from, setFrom] = useState(range.preset === 'custom' ? range.startDay : '')
  const [to, setTo] = useState(range.preset === 'custom' ? range.endDay : '')

  useEffect(() => {
    if (range.preset === 'custom') {
      setFrom(range.startDay)
      setTo(range.endDay)
    }
  }, [range.preset, range.startDay, range.endDay])

  return (
    <div
      className={cn(
        'flex flex-col gap-4 rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.06] via-transparent to-white/[0.02] p-4 shadow-[var(--shadow-card)] ring-1 ring-inset ring-white/[0.04] sm:flex-row sm:flex-wrap sm:items-center sm:justify-between',
        isPending && 'pointer-events-none opacity-70',
      )}
    >
      <div className="flex flex-wrap gap-2.5">
        {PRESETS.map((p) => {
          const active = range.preset === p.id
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => navigatePreset(p.id)}
              className={cn(
                'touch-manipulation min-h-11 rounded-full px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] transition-[background,color,box-shadow] duration-200',
                active
                  ? 'bg-electric/25 text-electric shadow-[inset_0_0_0_1px_rgba(59,130,246,0.35)]'
                  : 'bg-white/[0.04] text-muted hover:bg-white/[0.08] hover:text-soft',
              )}
            >
              {p.label}
            </button>
          )
        })}
      </div>
      <form
        className="flex min-w-0 flex-wrap items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault()
          if (!from || !to) return
          navigateCustom(from, to)
        }}
      >
        <label className="flex flex-col gap-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
          From
          <input
            name="from"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="touch-manipulation min-h-11 rounded-xl border border-white/[0.1] bg-matte/60 px-3 py-2.5 text-sm text-soft outline-none focus:border-electric/40"
          />
        </label>
        <label className="flex flex-col gap-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
          To
          <input
            name="to"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="touch-manipulation min-h-11 rounded-xl border border-white/[0.1] bg-matte/60 px-3 py-2.5 text-sm text-soft outline-none focus:border-electric/40"
          />
        </label>
        <Button
          type="submit"
          variant="secondary"
          size="sm"
          className={cn('min-h-11', range.preset === 'custom' && 'ring-1 ring-electric/35')}
        >
          Custom range
        </Button>
      </form>
    </div>
  )
}
