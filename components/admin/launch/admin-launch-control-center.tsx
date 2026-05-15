'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  ExternalLink,
  Globe,
  Rocket,
  Server,
  XCircle,
} from 'lucide-react'

import { AdminCard, AdminCardContent } from '@/components/admin/admin-card'
import {
  toggleLaunchChecklistItemAction,
  updateLaunchQaSignoffAction,
} from '@/lib/admin/actions/launch-actions'
import type { LaunchChecklistItem, LaunchItemStatus, LaunchReadinessBundle } from '@/lib/admin/data/launch-readiness'
import type { LaunchSectionId } from '@/lib/admin/launch/checklist-definition'
import { cn } from '@/lib/utils/cn'

const ease = [0.22, 1, 0.36, 1] as const

const STATUS_STYLE: Record<LaunchItemStatus, string> = {
  healthy: 'border-emerald-400/25 bg-emerald-500/10 text-emerald-200',
  warn: 'border-amber-400/25 bg-amber-500/10 text-amber-200',
  critical: 'border-rose-400/25 bg-rose-500/10 text-rose-200',
  pending: 'border-white/[0.08] bg-white/[0.04] text-muted',
  unknown: 'border-white/[0.06] bg-white/[0.02] text-muted',
}

const ENV_STYLE = {
  healthy: 'border-emerald-400/30 bg-emerald-500/[0.07]',
  warn: 'border-amber-400/30 bg-amber-500/[0.07]',
  unknown: 'border-white/[0.08] bg-white/[0.03]',
} as const

const QA_STATUS_OPTIONS = [
  { value: 'pending' as const, label: 'Pending' },
  { value: 'passed' as const, label: 'Passed' },
  { value: 'failed' as const, label: 'Failed' },
  { value: 'blocked' as const, label: 'Blocked' },
]

type Props = {
  bundle: LaunchReadinessBundle
  canWrite: boolean
}

function ReadinessRing({ percent }: { percent: number }) {
  const r = 54
  const c = 2 * Math.PI * r
  const offset = c - (percent / 100) * c
  const color = percent >= 90 ? '#34d399' : percent >= 70 ? '#fbbf24' : '#fb7185'

  return (
    <div className="relative mx-auto h-[140px] w-[140px] sm:mx-0">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120" aria-hidden>
        <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <motion.div
        className="absolute inset-0 flex flex-col items-center justify-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.15, ease }}
      >
        <span className="text-3xl font-semibold tabular-nums tracking-[-0.04em] text-soft">{percent}%</span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Ready</span>
      </motion.div>
    </div>
  )
}

function ChecklistRow({
  item,
  canWrite,
  onToggle,
  pending,
}: {
  item: LaunchChecklistItem
  canWrite: boolean
  onToggle: (key: string, next: boolean) => void
  pending: boolean
}) {
  const isManual = item.kind === 'manual'

  return (
    <li className="flex gap-3 border-b border-white/[0.05] py-3.5 last:border-0">
      {isManual && canWrite ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => onToggle(item.key, !item.completed)}
          className="mt-0.5 shrink-0 text-electric transition hover:opacity-80 disabled:opacity-40"
          aria-label={item.completed ? 'Mark incomplete' : 'Mark complete'}
        >
          {item.completed ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5 text-muted" />}
        </button>
      ) : (
        <span className="mt-0.5 shrink-0" aria-hidden>
          {item.completed ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          ) : item.status === 'critical' ? (
            <XCircle className="h-5 w-5 text-rose-400" />
          ) : (
            <Circle className="h-5 w-5 text-muted" />
          )}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className={cn('text-sm font-medium', item.completed ? 'text-soft' : 'text-soft/90')}>{item.label}</p>
          <span
            className={cn(
              'rounded-md border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
              STATUS_STYLE[item.status],
            )}
          >
            {item.kind === 'auto' ? 'Auto' : 'Manual'}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-muted">{item.description}</p>
        {item.detail ? <p className="mt-1 text-[11px] text-muted/80">{item.detail}</p> : null}
      </div>
    </li>
  )
}

export function AdminLaunchControlCenter({ bundle, canWrite }: Props) {
  const [activeSection, setActiveSection] = useState<LaunchSectionId | 'all'>('all')
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const filteredItems = useMemo(() => {
    if (activeSection === 'all') return bundle.items
    return bundle.items.filter((i) => i.section === activeSection)
  }, [bundle.items, activeSection])

  function handleToggle(key: string, next: boolean) {
    setError(null)
    startTransition(async () => {
      const res = await toggleLaunchChecklistItemAction(key, next)
      if (!res.ok) setError(res.message ?? 'Could not update item.')
    })
  }

  function handleQa(key: string, status: 'pending' | 'passed' | 'failed' | 'blocked') {
    setError(null)
    startTransition(async () => {
      const res = await updateLaunchQaSignoffAction(key, status)
      if (!res.ok) setError(res.message ?? 'Could not update QA sign-off.')
    })
  }

  return (
    <motion.div className="space-y-8 lg:space-y-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35, ease }}>
      {/* Hero */}
      <AdminCard>
        <AdminCardContent className="flex flex-col gap-8 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
            <ReadinessRing percent={bundle.readinessPercent} />
            <div className="text-center sm:text-left">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-electric/90">Launch control</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-soft sm:text-3xl">Production readiness</h2>
              <p className="mt-2 max-w-lg text-sm text-muted">
                {bundle.completedCount} of {bundle.totalCount} checklist items complete · QA {bundle.qaPercent}% passed
                · Running in <span className="text-soft">{bundle.currentEnvironment}</span>
              </p>
              <p className="mt-1 text-xs text-muted/80">
                Last checked {new Date(bundle.checkedAt).toLocaleString('en-IN')}
              </p>
            </div>
          </div>
          <Rocket className="hidden h-10 w-10 text-electric/50 sm:block" aria-hidden />
        </AdminCardContent>
      </AdminCard>

      {!bundle.serviceRoleAvailable ? (
        <AdminCard variant="risk">
          <AdminCardContent className="p-5 text-sm text-amber-100/90">
            Service role unavailable — automated probes and checklist persistence are limited. Set{' '}
            <code className="text-soft">SUPABASE_SERVICE_ROLE_KEY</code> on the server.
          </AdminCardContent>
        </AdminCard>
      ) : null}

      {error ? (
        <p className="rounded-xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{error}</p>
      ) : null}

      {/* Operational alerts */}
      {bundle.alerts.length > 0 ? (
        <AdminCard variant="risk">
          <AdminCardContent className="space-y-3 p-6 sm:p-8">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-300" />
              <h2 className="text-lg font-semibold text-soft">Operational alerts</h2>
            </div>
            <ul className="space-y-2">
              {bundle.alerts.map((a) => (
                <li
                  key={a.id}
                  className={cn(
                    'flex flex-wrap items-start justify-between gap-2 rounded-xl border px-4 py-3',
                    a.severity === 'critical'
                      ? 'border-rose-400/25 bg-rose-500/10'
                      : 'border-amber-400/25 bg-amber-500/10',
                  )}
                >
                  <div>
                    <p className="text-sm font-medium text-soft">{a.title}</p>
                    <p className="mt-0.5 text-xs text-muted">{a.body}</p>
                  </div>
                  {a.href ? (
                    <Link href={a.href} className="inline-flex items-center gap-1 text-xs text-electric hover:underline">
                      View <ExternalLink className="h-3 w-3" />
                    </Link>
                  ) : null}
                </li>
              ))}
            </ul>
          </AdminCardContent>
        </AdminCard>
      ) : null}

      {/* Environments */}
      <div>
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Deployment environments</p>
        <div className="grid gap-4 md:grid-cols-3">
          {bundle.environments.map((env) => (
            <AdminCard key={env.id} className={cn('border', ENV_STYLE[env.status])}>
              <AdminCardContent className="p-5">
                <motion.div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-soft">{env.label}</p>
                    {env.isCurrent ? (
                      <span className="mt-1 inline-block rounded-md border border-electric/30 bg-electric/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-electric">
                        Current
                      </span>
                    ) : null}
                  </div>
                  {env.id === 'production' ? (
                    <Globe className="h-5 w-5 text-electric/60" />
                  ) : (
                    <Server className="h-5 w-5 text-electric/60" />
                  )}
                </motion.div>
                {env.url ? (
                  <p className="mt-3 truncate font-mono text-xs text-muted">{env.url}</p>
                ) : (
                  <p className="mt-3 text-xs text-muted">—</p>
                )}
                <p className="mt-2 text-[11px] text-muted/80">{env.detail}</p>
              </AdminCardContent>
            </AdminCard>
          ))}
        </div>
      </div>

      {/* Section progress */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {bundle.sections.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setActiveSection(s.id)}
            className={cn(
              'rounded-2xl border p-4 text-left transition',
              activeSection === s.id
                ? 'border-electric/35 bg-electric/10'
                : 'border-white/[0.08] bg-white/[0.03] hover:border-white/[0.12]',
            )}
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">{s.label}</p>
            <p className="mt-2 text-xl font-semibold tabular-nums text-soft">{s.percent}%</p>
            <p className="mt-0.5 text-[11px] text-muted">
              {s.completed}/{s.total}
            </p>
          </button>
        ))}
      </div>

      {/* Checklist */}
      <AdminCard>
        <AdminCardContent className="p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-soft">Launch checklist</h2>
            <button
              type="button"
              onClick={() => setActiveSection('all')}
              className={cn(
                'text-xs font-medium transition',
                activeSection === 'all' ? 'text-electric' : 'text-muted hover:text-soft',
              )}
            >
              Show all sections
            </button>
          </div>
          <ul className="mt-4">
            {filteredItems.map((item) => (
              <ChecklistRow key={item.key} item={item} canWrite={canWrite} onToggle={handleToggle} pending={pending} />
            ))}
          </ul>
        </AdminCardContent>
      </AdminCard>

      {/* Final QA */}
      <AdminCard>
        <AdminCardContent className="space-y-5 p-6 sm:p-8">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-electric/90">Final QA</p>
            <h2 className="mt-2 text-lg font-semibold text-soft">Sign-off tracking</h2>
            <p className="mt-1 text-sm text-muted">{bundle.qaPercent}% passed · Record staging and production validation.</p>
          </div>
          <ul className="space-y-4">
            {bundle.qaItems.map((qa) => (
              <li key={qa.key} className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
                <p className="font-medium text-soft">{qa.label}</p>
                <p className="mt-1 text-xs text-muted">{qa.description}</p>
                {canWrite ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {QA_STATUS_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        disabled={pending}
                        onClick={() => handleQa(qa.key, opt.value)}
                        className={cn(
                          'rounded-lg border px-3 py-1.5 text-xs font-medium transition disabled:opacity-40',
                          qa.status === opt.value
                            ? 'border-electric/40 bg-electric/15 text-electric'
                            : 'border-white/[0.08] text-muted hover:text-soft',
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-xs capitalize text-muted">Status: {qa.status}</p>
                )}
              </li>
            ))}
          </ul>
        </AdminCardContent>
      </AdminCard>
    </motion.div>
  )
}
