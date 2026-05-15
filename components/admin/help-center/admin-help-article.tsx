'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { AlertTriangle, ArrowLeft, CheckCircle2, Clock, ExternalLink } from 'lucide-react'

import { AdminCard, AdminCardContent } from '@/components/admin/admin-card'
import { categoryLabel } from '@/lib/admin/help-center/categories'
import type { HelpArticle } from '@/lib/admin/help-center/types'
import { cn } from '@/lib/utils/cn'

const ease = [0.22, 1, 0.36, 1] as const

type Props = {
  article: HelpArticle
}

function renderBody(body: string) {
  return body.split('\n').map((line, i) => {
    const trimmed = line.trim()
    if (!trimmed) return <br key={i} />
    const numbered = /^(\d+)\.\s/.exec(trimmed)
    if (numbered) {
      return (
        <p key={i} className="ml-1 flex gap-2 text-sm leading-relaxed text-muted">
          <span className="shrink-0 font-medium text-soft">{numbered[1]}.</span>
          <span>{trimmed.replace(/^\d+\.\s/, '')}</span>
        </p>
      )
    }
    return (
      <p key={i} className="text-sm leading-relaxed text-muted">
        {trimmed}
      </p>
    )
  })
}

export function AdminHelpArticle({ article }: Props) {
  return (
    <motion.div className="space-y-6 lg:space-y-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35, ease }}>
      <Link
        href="/admin/help"
        className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-electric"
      >
        <ArrowLeft className="h-4 w-4" />
        All procedures
      </Link>

      <header className="space-y-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-electric/90">{categoryLabel(article.category)}</p>
        <h1 className="text-3xl font-semibold tracking-tight text-soft sm:text-4xl">{article.title}</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted">{article.description}</p>
        <p className="flex items-center gap-1.5 text-xs text-muted">
          <Clock className="h-3.5 w-3.5" />~{article.estimatedMinutes} min · Standard operating procedure
        </p>
      </header>

      {article.incidentNote ? (
        <AdminCard className="border-amber-400/20 bg-amber-500/[0.06]">
          <AdminCardContent className="flex gap-3 p-5 sm:p-6">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" aria-hidden />
            <p className="text-sm leading-relaxed text-amber-100/90">{article.incidentNote}</p>
          </AdminCardContent>
        </AdminCard>
      ) : null}

      <div className="space-y-4">
        {article.sections.map((section, i) => (
          <AdminCard key={section.id}>
            <AdminCardContent className="space-y-3 p-6 sm:p-8">
              <h2 className="text-lg font-semibold text-soft">
                <span className="mr-2 text-electric/70">{i + 1}.</span>
                {section.title}
              </h2>
              <div className="space-y-2">{renderBody(section.body)}</div>
            </AdminCardContent>
          </AdminCard>
        ))}
      </div>

      {article.checklist.length > 0 ? (
        <AdminCard>
          <AdminCardContent className="space-y-4 p-6 sm:p-8">
            <h2 className="text-lg font-semibold text-soft">Checklist</h2>
            <ul className="space-y-2.5">
              {article.checklist.map((item) => (
                <li key={item.id} className="flex items-start gap-3 text-sm">
                  <CheckCircle2
                    className={cn('mt-0.5 h-4 w-4 shrink-0', item.critical ? 'text-electric' : 'text-muted')}
                    aria-hidden
                  />
                  <span className={cn(item.critical ? 'font-medium text-soft' : 'text-muted')}>
                    {item.label}
                    {item.critical ? (
                      <span className="ml-2 rounded-md border border-electric/30 bg-electric/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-electric">
                        Required
                      </span>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
          </AdminCardContent>
        </AdminCard>
      ) : null}

      {article.relatedLinks.length > 0 ? (
        <AdminCard>
          <AdminCardContent className="space-y-3 p-6 sm:p-8">
            <h2 className="text-lg font-semibold text-soft">Related in admin</h2>
            <ul className="flex flex-wrap gap-2">
              {article.relatedLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.1] bg-white/[0.04] px-3 py-2 text-sm text-soft transition hover:border-electric/30 hover:text-electric"
                  >
                    {link.label}
                    <ExternalLink className="h-3.5 w-3.5 opacity-60" />
                  </Link>
                </li>
              ))}
            </ul>
          </AdminCardContent>
        </AdminCard>
      ) : null}
    </motion.div>
  )
}
