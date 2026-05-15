'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, CheckCircle2, Circle } from 'lucide-react'

import { AdminCard, AdminCardContent } from '@/components/admin/admin-card'
import type { OnboardingTrack } from '@/lib/admin/help-center/types'
const ease = [0.22, 1, 0.36, 1] as const

type Props = {
  tracks: OnboardingTrack[]
}

export function AdminHelpOnboarding({ tracks }: Props) {
  return (
    <motion.div className="space-y-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35, ease }}>
      <Link
        href="/admin/help"
        className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-electric"
      >
        <ArrowLeft className="h-4 w-4" />
        Help center
      </Link>

      {tracks.map((track, ti) => (
        <AdminCard key={`${track.role}-${track.title}`}>
          <AdminCardContent className="space-y-5 p-6 sm:p-8">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-electric/90">Walkthrough</p>
              <h2 className="mt-2 text-xl font-semibold text-soft sm:text-2xl">{track.title}</h2>
              <p className="mt-2 text-sm text-muted">{track.description}</p>
            </div>
            <ol className="space-y-0">
              {track.steps.map((step, si) => {
                const isLast = si === track.steps.length - 1
                return (
                  <li key={step.id} className="relative flex gap-4 pb-6 last:pb-0">
                    {!isLast ? (
                      <span
                        className="absolute left-[11px] top-7 h-[calc(100%-1.25rem)] w-px bg-white/[0.08]"
                        aria-hidden
                      />
                    ) : null}
                    <span className="relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-electric/30 bg-electric/10">
                      <Circle className="h-2.5 w-2.5 fill-electric text-electric" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium uppercase tracking-wider text-muted">Step {si + 1}</p>
                      <Link
                        href={step.href}
                        className="group mt-1 block rounded-xl border border-transparent p-2 -ml-2 transition hover:border-white/[0.08] hover:bg-white/[0.03]"
                      >
                        <p className="font-medium text-soft group-hover:text-electric">{step.title}</p>
                        <p className="mt-1 text-sm text-muted">{step.description}</p>
                        {step.articleSlug ? (
                          <p className="mt-2 inline-flex items-center gap-1 text-xs text-electric/90">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Linked SOP
                          </p>
                        ) : null}
                      </Link>
                    </div>
                  </li>
                )
              })}
            </ol>
          </AdminCardContent>
        </AdminCard>
      ))}

      {tracks.length === 0 ? (
        <p className="text-center text-sm text-muted">No onboarding tracks for your role.</p>
      ) : null}
    </motion.div>
  )
}
