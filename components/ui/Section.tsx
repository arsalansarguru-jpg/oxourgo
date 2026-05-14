import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

type SectionProps = HTMLAttributes<HTMLElement> & {
  contained?: boolean
}

export function Section({ className, contained = true, children, ...props }: SectionProps) {
  return (
    <section
      className={cn('py-[var(--spacing-section-y)]', className)}
      {...props}
    >
      {contained ? (
        <div className="container-app flex min-w-0 flex-col gap-[var(--spacing-section-gap)] md:gap-[clamp(2.25rem,6vw,5rem)]">
          {children}
        </div>
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
  className,
}: {
  eyebrow?: string
  title: string
  subtitle?: string
  className?: string
}) {
  return (
    <header className={cn('mx-auto max-w-3xl shrink-0 text-center', className)}>
      {eyebrow ? (
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-electric/85">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="text-section-title text-soft">{title}</h2>
      {subtitle ? (
        <p className="mx-auto mt-4 max-w-2xl text-pretty px-1 text-[0.9375rem] leading-[1.68] text-muted sm:px-0 sm:text-base md:text-[1.0625rem]">
          {subtitle}
        </p>
      ) : null}
    </header>
  )
}
