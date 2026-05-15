'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Clock, GraduationCap, Map, Users } from 'lucide-react'

import { AdminTrainingSearch } from '@/components/admin/training/admin-training-search'
import { AdminCard, AdminCardContent } from '@/components/admin/admin-card'
import { searchTrainingModules } from '@/lib/admin/training/search'
import { TRAINING_TRACKS, trackLabel } from '@/lib/admin/training/tracks'
import type { TrainingModule } from '@/lib/admin/training/types'
import type { AppAuthRole } from '@/lib/auth/roles'
import { cn } from '@/lib/utils/cn'

const ease = [0.22, 1, 0.36, 1] as const

type Props = {
  modules: TrainingModule[]
  role: AppAuthRole
}

export function AdminTrainingHub({ modules, role }: Props) {
  const [query, setQuery] = useState('')
  const [track, setTrack] = useState<'all' | 'operations' | 'owner'>('all')

  const filtered = useMemo(() => {
    let list = searchTrainingModules(modules, query, role)
    if (track !== 'all') list = list.filter((m) => m.track === track)
    return list
  }, [modules, query, role, track])

  const opsCount = modules.filter((m) => m.track === 'operations').length
  const ownerCount = modules.filter((m) => m.track === 'owner').length

  return (
    <motion.div className="space-y-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35, ease }}>
      <AdminCard>
        <AdminCardContent className="space-y-5 p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-electric/20 bg-electric/10">
              <GraduationCap className="h-6 w-6 text-electric" aria-hidden />
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/admin/training/onboarding"
                className="inline-flex items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-soft transition hover:border-electric/30 hover:bg-electric/10"
              >
                <Map className="h-4 w-4 text-electric" />
                Walkthroughs
              </Link>
              <Link
                href="/admin/training/guides"
                className="inline-flex items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-soft transition hover:border-electric/30 hover:bg-electric/10"
              >
                <Users className="h-4 w-4 text-electric" />
                Role guides
              </Link>
            </div>
          </div>
          <AdminTrainingSearch value={query} onChange={setQuery} />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setTrack('all')}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-medium transition',
                track === 'all'
                  ? 'border-electric/40 bg-electric/15 text-electric'
                  : 'border-white/[0.08] bg-white/[0.03] text-muted hover:text-soft',
              )}
            >
              All ({modules.length})
            </button>
            {TRAINING_TRACKS.map((t) => {
              const Icon = t.icon
              const count = t.id === 'operations' ? opsCount : ownerCount
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTrack(t.id)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition',
                    track === t.id
                      ? 'border-electric/40 bg-electric/15 text-electric'
                      : 'border-white/[0.08] bg-white/[0.03] text-muted hover:text-soft',
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {t.label} ({count})
                </button>
              )
            })}
          </div>
        </AdminCardContent>
      </AdminCard>

      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-white/[0.1] bg-white/[0.02] px-6 py-12 text-center text-sm text-muted">
          No tutorials match your search. Try another keyword or clear filters.
        </p>
      ) : (
        <motion.div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((mod, i) => (
            <motion.div
              key={mod.slug}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03, duration: 0.28, ease }}
            >
              <Link
                href={`/admin/training/${mod.slug}`}
                className="group flex h-full flex-col rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 transition hover:border-electric/25 hover:bg-white/[0.05]"
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-electric/80">
                  {trackLabel(mod.track)}
                </p>
                <h2 className="mt-2 text-lg font-semibold tracking-tight text-soft group-hover:text-white">{mod.title}</h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{mod.description}</p>
                <p className="mt-4 flex items-center gap-3 text-xs text-muted">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />~{mod.estimatedMinutes} min
                  </span>
                  <span>{mod.steps.length} steps</span>
                </p>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  )
}
