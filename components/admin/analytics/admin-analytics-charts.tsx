'use client'

import { useId } from 'react'
import { motion } from 'framer-motion'

import type { AdminAnalyticsSeriesPoint } from '@/lib/admin/data/analytics'
import { cn } from '@/lib/utils/cn'

const ease = [0.22, 1, 0.36, 1] as const

function buildAreaPath(values: readonly number[], width: number, height: number, padX: number, padY: number) {
  if (values.length === 0) return { line: '', area: '' }
  const rawMax = Math.max(...values, 0)
  const max = rawMax > 0 ? rawMax : 1
  const min = rawMax > 0 ? Math.min(...values) * 0.85 : 0
  const span = max - min || 1
  const innerW = width - padX * 2
  const innerH = height - padY * 2
  const pts = values.map((v, i) => {
    const x = padX + (i / Math.max(values.length - 1, 1)) * innerW
    const y = padY + innerH - ((v - min) / span) * innerH
    return [x, y] as const
  })
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')
  const baseY = height - padY
  const area = `M ${pts[0][0].toFixed(1)} ${baseY.toFixed(1)} ${pts.map((p) => `L ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')} L ${pts[pts.length - 1][0].toFixed(1)} ${baseY.toFixed(1)} Z`
  return { line, area }
}

function shortDayLabel(ymd: string) {
  const [, m, d] = ymd.split('-')
  return `${m}/${d}`
}

export function AnalyticsSeriesArea({
  points,
  accent = 'electric',
  valueFormatter,
}: {
  points: AdminAnalyticsSeriesPoint[]
  accent?: 'electric' | 'emerald' | 'amber'
  valueFormatter: (n: number) => string
}) {
  const uid = useId().replace(/[:]/g, '')
  const fillElId = `aFillEl-${uid}`
  const strokeElId = `aStrokeEl-${uid}`
  const fillEmId = `aFillEm-${uid}`
  const strokeEmId = `aStrokeEm-${uid}`
  const fillAmId = `aFillAm-${uid}`
  const strokeAmId = `aStrokeAm-${uid}`

  const values = points.map((p) => p.value)
  const rawMax = values.length ? Math.max(...values, 0) : 0
  const w = 720
  const h = 200
  const pad = 24
  const { line, area } = buildAreaPath(values, w, h, pad, pad)
  const max = rawMax > 0 ? rawMax : 0
  const stroke =
    accent === 'emerald'
      ? `url(#${strokeEmId})`
      : accent === 'amber'
        ? `url(#${strokeAmId})`
        : `url(#${strokeElId})`
  const fill =
    accent === 'emerald'
      ? `url(#${fillEmId})`
      : accent === 'amber'
        ? `url(#${fillAmId})`
        : `url(#${fillElId})`

  const tickStep = Math.max(1, Math.ceil(points.length / 6))

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="none"
        className="h-[180px] w-full overflow-visible sm:h-[200px]"
        role="img"
        aria-label="Series chart"
      >
        <defs>
          <linearGradient id={fillElId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgb(59, 130, 246)" stopOpacity="0.38" />
            <stop offset="100%" stopColor="rgb(59, 130, 246)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={strokeElId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgb(147, 197, 253)" />
            <stop offset="100%" stopColor="rgb(59, 130, 246)" />
          </linearGradient>
          <linearGradient id={fillEmId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgb(52, 211, 153)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="rgb(52, 211, 153)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={strokeEmId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgb(167, 243, 208)" />
            <stop offset="100%" stopColor="rgb(16, 185, 129)" />
          </linearGradient>
          <linearGradient id={fillAmId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgb(251, 191, 36)" stopOpacity="0.32" />
            <stop offset="100%" stopColor="rgb(251, 191, 36)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={strokeAmId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgb(253, 224, 71)" />
            <stop offset="100%" stopColor="rgb(245, 158, 11)" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3].map((i) => (
          <line
            key={i}
            x1={pad}
            y1={pad + (i * (h - pad * 2)) / 3}
            x2={w - pad}
            y2={pad + (i * (h - pad * 2)) / 3}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="1"
          />
        ))}
        <motion.path
          d={area}
          fill={fill}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, ease }}
        />
        <motion.path
          d={line}
          fill="none"
          stroke={stroke}
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.85, ease }}
        />
      </svg>
      <div className="mt-1 flex justify-between gap-1 overflow-hidden text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
        {points.map((p, i) =>
          i % tickStep === 0 || i === points.length - 1 ? (
            <span key={p.date} className="shrink-0">
              {shortDayLabel(p.date)}
            </span>
          ) : null,
        )}
      </div>
      <p className="mt-2 text-right text-[11px] font-medium tabular-nums text-muted">
        {rawMax > 0 ? (
          <>
            Peak <span className="text-soft">{valueFormatter(max)}</span>
          </>
        ) : (
          <span>No activity in range</span>
        )}
      </p>
    </div>
  )
}

export function AnalyticsDailyBars({ points, color }: { points: AdminAnalyticsSeriesPoint[]; color: string }) {
  const rawMax = points.length ? Math.max(...points.map((p) => p.value), 0) : 0
  const max = rawMax > 0 ? rawMax : 1
  const w = 720
  const h = 180
  const pad = 20
  const innerW = w - pad * 2
  const innerH = h - pad * 2
  const barW = innerW / Math.max(points.length, 1) - 2

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className="h-[160px] w-full sm:h-[180px]"
      role="img"
      aria-label="Daily volume chart"
    >
      {points.map((p, i) => {
        const bh = (p.value / max) * innerH
        const x = pad + (i / Math.max(points.length - 1, 1)) * innerW - barW / 2
        const y = pad + innerH - bh
        return (
          <motion.rect
            key={p.date}
            x={x}
            y={y}
            width={Math.max(barW, 2)}
            height={Math.max(bh, 0)}
            rx={3}
            fill={color}
            initial={{ height: 0, y: pad + innerH }}
            animate={{ height: Math.max(bh, 0), y }}
            transition={{ duration: 0.45, delay: i * 0.012, ease }}
          />
        )
      })}
    </svg>
  )
}

export function AnalyticsHorizontalBars({
  rows,
  valueLabel,
}: {
  rows: { label: string; value: number }[]
  valueLabel: (n: number) => string
}) {
  const rawMax = rows.length ? Math.max(...rows.map((r) => r.value), 0) : 0
  const max = rawMax > 0 ? rawMax : 1
  if (rows.length === 0 || rawMax === 0) {
    return <p className="text-sm text-muted">No data in this range.</p>
  }
  return (
    <ul className="space-y-3">
      {rows.map((r, i) => (
        <li key={r.label + i} className="space-y-1.5">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="min-w-0 truncate font-medium text-soft">{r.label}</span>
            <span className="shrink-0 tabular-nums text-muted">{valueLabel(r.value)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
            <motion.div
              className={cn('h-full rounded-full bg-gradient-to-r from-electric/90 to-sky-400/90')}
              initial={{ width: 0 }}
              whileInView={{ width: `${Math.min(100, (r.value / max) * 100)}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.75, delay: i * 0.05, ease }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}

export function AnalyticsAvailabilityLine({ points }: { points: AdminAnalyticsSeriesPoint[] }) {
  const values = points.map((p) => p.value)
  const w = 720
  const h = 160
  const pad = 22
  const { line } = buildAreaPath(values, w, h, pad, pad)
  const avg = points.length ? Math.round(points.reduce((s, p) => s + p.value, 0) / points.length) : 0
  return (
    <div>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="none"
        className="h-[140px] w-full sm:h-[160px]"
        role="img"
        aria-label="Fleet availability"
      >
        {[0, 1, 2, 3, 4].map((i) => (
          <line
            key={i}
            x1={pad}
            y1={pad + (i * (h - pad * 2)) / 4}
            x2={w - pad}
            y2={pad + (i * (h - pad * 2)) / 4}
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="1"
          />
        ))}
        <motion.path
          d={line}
          fill="none"
          stroke="rgb(148, 163, 184)"
          strokeWidth="2.2"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.9, ease }}
        />
      </svg>
      <p className="text-right text-[11px] text-muted">
        Range average{' '}
        <span className="font-semibold tabular-nums text-soft">{avg}%</span> of bookable fleet showing as available
      </p>
    </div>
  )
}
