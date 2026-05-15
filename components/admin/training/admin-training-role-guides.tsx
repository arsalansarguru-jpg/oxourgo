'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react'

import { AdminCard, AdminCardContent } from '@/components/admin/admin-card'
import type { TrainingModule } from '@/lib/admin/training/types'
import type { TrainingRoleGuide } from '@/lib/admin/training/types'

const ease = [0.22, 1, 0.36, 1] as const

type Props = {
  guides: TrainingRoleGuide[]
  modulesBySlug: Map<string, TrainingModule>
}

export function AdminTrainingRoleGuides({ guides, modulesBySlug }: Props) {
  return (
    <motion.div className="space-y-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35, ease }}>
      <Link
        href="/admin/training"
        className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-electric"
      >
        <ArrowLeft className="h-4 w-4" />
        Training center
      </Link>

      {guides.map((guide) => {
        const modules = guide.moduleSlugs
          .map((slug) => modulesBySlug.get(slug))
          .filter((m): m is TrainingModule => Boolean(m))

        return (
          <AdminCard key={`${guide.role}-${guide.title}`}>
            <AdminCardContent className="space-y-5 p-6 sm:p-8">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-electric/90">Role guide</p>
                <h2 className="mt-2 text-xl font-semibold text-soft">{guide.title}</h2>
                <p className="mt-2 text-sm text-muted">{guide.description}</p>
                <p className="mt-2 text-xs text-muted">{modules.length} modules in this path</p>
              </div>
              <ol className="space-y-2">
                {modules.map((mod, i) => (
                  <li key={mod.slug}>
                    <Link
                      href={`/admin/training/${mod.slug}`}
                      className="group flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 transition hover:border-electric/25 hover:bg-white/[0.04]"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-electric/10 text-xs font-semibold text-electric">
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-soft group-hover:text-electric">{mod.title}</p>
                        <p className="truncate text-xs text-muted">{mod.description}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 shrink-0 text-muted group-hover:text-electric" />
                    </Link>
                  </li>
                ))}
              </ol>
              {modules.length > 0 ? (
                <Link
                  href={`/admin/training/${modules[0]!.slug}`}
                  className="inline-flex items-center gap-2 text-sm font-medium text-electric hover:underline"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Start path
                </Link>
              ) : null}
            </AdminCardContent>
          </AdminCard>
        )
      })}
    </motion.div>
  )
}
