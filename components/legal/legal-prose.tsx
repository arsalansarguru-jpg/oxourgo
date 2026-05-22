import type { ReactNode } from 'react'
import Link from 'next/link'
import { Section } from '@/components/ui/Section'

type LegalProseProps = {
  title: string
  kicker?: string
  children: ReactNode
}

export function LegalProse({ title, kicker, children }: LegalProseProps) {
  return (
    <Section className="pt-10 pb-16">
      <article className="mx-auto max-w-3xl">
        <header>
          {kicker ? (
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-electric">{kicker}</p>
          ) : null}
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-soft md:text-4xl">{title}</h1>
        </header>
        <div className="mt-8 max-w-none space-y-4 text-sm leading-relaxed text-silver md:text-base">{children}</div>
        <nav
          aria-label="Legal site links"
          className="mt-12 flex flex-wrap gap-x-5 gap-y-1 border-t border-stroke pt-8 text-sm text-muted"
        >
          <Link href="/sitemap" className="transition-colors hover:text-electric">
            Sitemap
          </Link>
          <Link href="/accessibility" className="transition-colors hover:text-electric">
            Accessibility
          </Link>
          <Link href="/cookies" className="transition-colors hover:text-electric">
            Cookies
          </Link>
        </nav>
      </article>
    </Section>
  )
}
