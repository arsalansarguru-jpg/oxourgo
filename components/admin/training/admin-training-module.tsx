'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  Lightbulb,
  PlayCircle,
} from 'lucide-react'

import { AdminCard, AdminCardContent } from '@/components/admin/admin-card'
import { trackLabel } from '@/lib/admin/training/tracks'
import type { TrainingModule } from '@/lib/admin/training/types'
import { cn } from '@/lib/utils/cn'

const ease = [0.22, 1, 0.36, 1] as const

type Props = {
  module: TrainingModule
}

export function AdminTrainingModule({ module: mod }: Props) {
  const [stepIndex, setStepIndex] = useState(0)
  const step = mod.steps[stepIndex]
  const progress = Math.round(((stepIndex + 1) / mod.steps.length) * 100)

  return (
    <motion.div className="space-y-6 lg:space-y-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35, ease }}>
      <Link
        href="/admin/training"
        className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-electric"
      >
        <ArrowLeft className="h-4 w-4" />
        Training center
      </Link>

      <header className="space-y-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-electric/90">{trackLabel(mod.track)}</p>
        <h1 className="text-3xl font-semibold tracking-tight text-soft sm:text-4xl">{mod.title}</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted">{mod.description}</p>
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
          <span>~{mod.estimatedMinutes} min</span>
          <span>·</span>
          <span>{mod.steps.length} steps</span>
        </div>
        <div className="h-1.5 max-w-md overflow-hidden rounded-full bg-white/[0.06]">
          <motion.div
            className="h-full rounded-full bg-electric"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease }}
          />
        </div>
      </header>

      {mod.objectives.length > 0 ? (
        <AdminCard>
          <AdminCardContent className="p-6 sm:p-8">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted">Learning objectives</h2>
            <ul className="mt-3 space-y-2">
              {mod.objectives.map((obj) => (
                <li key={obj} className="flex items-start gap-2 text-sm text-soft">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-electric" />
                  {obj}
                </li>
              ))}
            </ul>
          </AdminCardContent>
        </AdminCard>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,240px)_1fr]">
        <nav className="hidden lg:block">
          <ol className="space-y-1">
            {mod.steps.map((s, i) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => setStepIndex(i)}
                  className={cn(
                    'w-full rounded-xl px-3 py-2.5 text-left text-sm transition',
                    i === stepIndex
                      ? 'bg-electric/15 font-medium text-electric'
                      : 'text-muted hover:bg-white/[0.04] hover:text-soft',
                  )}
                >
                  <span className="mr-2 text-xs opacity-60">{i + 1}.</span>
                  {s.title}
                </button>
              </li>
            ))}
          </ol>
        </nav>

        <AdminCard>
          <AdminCardContent className="space-y-5 p-6 sm:p-8">
            <p className="text-xs font-medium uppercase tracking-wider text-muted">
              Step {stepIndex + 1} of {mod.steps.length}
            </p>
            <AnimatePresence mode="wait">
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.25, ease }}
                className="space-y-4"
              >
                <h2 className="text-xl font-semibold text-soft">{step.title}</h2>
                <p className="text-sm leading-relaxed text-muted whitespace-pre-line">{step.body}</p>
                {step.tip ? (
                  <div className="flex gap-3 rounded-xl border border-amber-400/20 bg-amber-500/[0.06] p-4">
                    <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
                    <p className="text-sm text-amber-100/90">{step.tip}</p>
                  </div>
                ) : null}
                <div className="flex flex-wrap gap-2 pt-2">
                  {step.adminHref ? (
                    <Link
                      href={step.adminHref}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-electric/30 bg-electric/10 px-3 py-2 text-sm font-medium text-electric transition hover:bg-electric/15"
                    >
                      <PlayCircle className="h-4 w-4" />
                      Open in admin
                      <ExternalLink className="h-3.5 w-3.5 opacity-70" />
                    </Link>
                  ) : null}
                  {step.helpSlug ? (
                    <Link
                      href={`/admin/help/${step.helpSlug}`}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.1] bg-white/[0.04] px-3 py-2 text-sm text-soft transition hover:border-white/[0.15]"
                    >
                      <BookOpen className="h-4 w-4 text-muted" />
                      Related SOP
                    </Link>
                  ) : null}
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] pt-5">
              <button
                type="button"
                disabled={stepIndex === 0}
                onClick={() => setStepIndex((i) => i - 1)}
                className="inline-flex items-center gap-2 rounded-xl border border-white/[0.1] px-4 py-2 text-sm font-medium text-soft transition hover:bg-white/[0.04] disabled:opacity-40"
              >
                <ArrowLeft className="h-4 w-4" />
                Previous
              </button>
              {stepIndex < mod.steps.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setStepIndex((i) => i + 1)}
                  className="inline-flex items-center gap-2 rounded-xl border border-electric/35 bg-electric/15 px-4 py-2 text-sm font-medium text-electric transition hover:bg-electric/20"
                >
                  Next
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <Link
                  href="/admin/training"
                  className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-200 transition hover:bg-emerald-500/15"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Complete module
                </Link>
              )}
            </div>
          </AdminCardContent>
        </AdminCard>
      </div>

      {mod.relatedLinks.length > 0 ? (
        <AdminCard>
          <AdminCardContent className="flex flex-wrap gap-2 p-6">
            <span className="w-full text-sm font-medium text-soft">Related</span>
            {mod.relatedLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="inline-flex items-center gap-1 rounded-xl border border-white/[0.1] bg-white/[0.04] px-3 py-2 text-sm text-soft transition hover:border-electric/30"
              >
                {link.label}
                <ExternalLink className="h-3.5 w-3.5 opacity-60" />
              </Link>
            ))}
          </AdminCardContent>
        </AdminCard>
      ) : null}
    </motion.div>
  )
}
