import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

type SectionProps = HTMLAttributes<HTMLElement> & {
  contained?: boolean
  variant?: 'default' | 'muted'
}

export function Section({
  className,
  contained = true,
  variant = 'default',
  children,
  ...props
}: SectionProps) {
  return (
    <section
      className={cn(
        'py-[var(--spacing-section-y)]',
        variant === 'muted' && 'bg-carbon-deep/50',
        className,
      )}
      {...props}
    >
      {contained ? (
        <div className="container-app flex min-w-0 flex-col gap-[var(--spacing-section-gap)]">{children}</div>
      ) : (
        children
      )}
    </section>
  )
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = 'left',
  className,
}: {
  eyebrow?: string
  title: string
  subtitle?: string
  align?: 'left' | 'center'
  className?: string
}) {
  return (
    <header
      className={cn(
        'max-w-2xl shrink-0',
        align === 'center' && 'mx-auto text-center',
        className,
      )}
    >
      {eyebrow ? <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted">{eyebrow}</p> : null}
      <h2 className="text-section-title text-soft">{title}</h2>
      {subtitle ? (
        <p className="mt-3 text-pretty text-sm leading-relaxed text-muted sm:text-base">{subtitle}</p>
      ) : null}
    </header>
  )
}
