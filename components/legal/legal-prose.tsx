import type { ReactNode } from 'react'
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
      </article>
    </Section>
  )
}
