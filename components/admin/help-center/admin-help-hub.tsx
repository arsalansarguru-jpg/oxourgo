'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { BookOpen, Clock, GraduationCap } from 'lucide-react'

import { AdminHelpSearch } from '@/components/admin/help-center/admin-help-search'
import { AdminCard, AdminCardContent } from '@/components/admin/admin-card'
import { HELP_CATEGORIES, categoryLabel } from '@/lib/admin/help-center/categories'
import { searchHelpArticles } from '@/lib/admin/help-center/search'
import type { HelpArticle } from '@/lib/admin/help-center/types'
import type { AppAuthRole } from '@/lib/auth/roles'
import { cn } from '@/lib/utils/cn'

const ease = [0.22, 1, 0.36, 1] as const

type Props = {
  articles: HelpArticle[]
  role: AppAuthRole
}

export function AdminHelpHub({ articles, role }: Props) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string | null>(null)

  const filtered = useMemo(() => {
    let list = searchHelpArticles(articles, query, role)
    if (category) list = list.filter((a) => a.category === category)
    return list
  }, [articles, query, role, category])

  return (
    <motion.div className="space-y-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35, ease }}>
      <AdminCard>
        <AdminCardContent className="space-y-5 p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <motion.div
              className="flex h-12 w-12 items-center justify-center rounded-2xl border border-electric/20 bg-electric/10"
              whileHover={{ scale: 1.03 }}
            >
              <BookOpen className="h-6 w-6 text-electric" aria-hidden />
            </motion.div>
            <Link
              href="/admin/help/onboarding"
              className="inline-flex items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-soft transition hover:border-electric/30 hover:bg-electric/10"
            >
              <GraduationCap className="h-4 w-4 text-electric" />
              Onboarding
            </Link>
          </div>
          <AdminHelpSearch value={query} onChange={setQuery} />
          <motion.div className="flex flex-wrap gap-2" layout>
            <button
              type="button"
              onClick={() => setCategory(null)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-medium transition',
                category === null
                  ? 'border-electric/40 bg-electric/15 text-electric'
                  : 'border-white/[0.08] bg-white/[0.03] text-muted hover:text-soft',
              )}
            >
              All
            </button>
            {HELP_CATEGORIES.map((cat) => {
              const Icon = cat.icon
              const count = articles.filter((a) => a.category === cat.id).length
              if (count === 0) return null
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id === category ? null : cat.id)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition',
                    category === cat.id
                      ? 'border-electric/40 bg-electric/15 text-electric'
                      : 'border-white/[0.08] bg-white/[0.03] text-muted hover:text-soft',
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {cat.label}
                </button>
              )
            })}
          </motion.div>
        </AdminCardContent>
      </AdminCard>

      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-white/[0.1] bg-white/[0.02] px-6 py-12 text-center text-sm text-muted">
          No procedures match your search. Try another keyword or clear filters.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((article, i) => (
            <motion.div
              key={article.slug}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.3, ease }}
            >
              <Link
                href={`/admin/help/${article.slug}`}
                className="group flex h-full flex-col rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 transition hover:border-electric/25 hover:bg-white/[0.05]"
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-electric/80">
                  {categoryLabel(article.category)}
                </p>
                <h2 className="mt-2 text-lg font-semibold tracking-tight text-soft group-hover:text-white">
                  {article.title}
                </h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{article.description}</p>
                <p className="mt-4 flex items-center gap-1.5 text-xs text-muted">
                  <Clock className="h-3.5 w-3.5" />
                  ~{article.estimatedMinutes} min read
                </p>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  )
}
