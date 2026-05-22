'use client'

import { forwardRef, type ButtonHTMLAttributes, type MouseEventHandler, type Ref } from 'react'
import NextLink from 'next/link'
import { adminActionClasses, type AdminActionTone } from '@/lib/design/admin-actions'
import { cn } from '@/lib/utils/cn'

const variants = {
  primary: [
    'border border-electric/50 bg-[linear-gradient(135deg,#0080ff_0%,#0066ff_48%,#004fcc_100%)] text-white',
    'shadow-[0_0_32px_-8px_var(--glow-electric)] hover:shadow-[0_0_40px_-6px_var(--glow-cyan)]',
    'hover:scale-[1.02] active:scale-[0.98]',
    'theme-light:text-white',
  ].join(' '),
  secondary: [
    'border border-stroke-strong bg-fill-glass-strong text-soft backdrop-blur-xl',
    'shadow-[inset_0_1px_0_rgb(255_255_255/0.08)] hover:border-electric/40 hover:shadow-[0_0_24px_-10px_var(--glow-electric)]',
    'theme-light:bg-white/90 theme-light:hover:bg-white',
  ].join(' '),
  ghost: 'text-soft hover:bg-fill-glass active:bg-fill-glass-strong',
  outline:
    'border border-electric/35 bg-transparent text-electric hover:bg-electric/10 hover:shadow-[0_0_20px_-8px_var(--glow-electric)]',
  danger: [
    'border border-red-400/40 bg-red-500/15 text-red-100',
    'hover:bg-red-500/25 hover:shadow-[0_0_24px_-8px_rgba(239,68,68,0.45)]',
    'theme-light:border-red-300 theme-light:bg-red-50 theme-light:text-red-800',
  ].join(' '),
  success: adminActionClasses.success,
  warning: adminActionClasses.warning,
  critical: adminActionClasses.critical,
} as const

const sizes = {
  sm: 'min-h-10 px-3.5 py-2 text-sm rounded-xl',
  md: 'min-h-11 px-4 py-2.5 text-sm rounded-xl',
  lg: 'min-h-12 px-6 py-3 text-sm rounded-xl',
} as const

const base =
  'touch-manipulation inline-flex shrink-0 items-center justify-center gap-2 text-sm font-medium tracking-wide transition-[transform,filter,background-color,border-color,box-shadow] duration-200 hover:-translate-y-0.5 focus-visible:shadow-none disabled:pointer-events-none disabled:translate-y-0 disabled:opacity-45'

export type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'href' | 'onClick'> & {
  variant?: keyof typeof variants
  size?: keyof typeof sizes
  /** Admin semantic action tone (maps to colored variants) */
  adminAction?: AdminActionTone
  to?: string
  href?: string
  target?: string
  rel?: string
  onClick?: MouseEventHandler<HTMLElement>
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className,
    variant = 'primary',
    size = 'md',
    adminAction,
    type = 'button',
    to,
    href,
    target,
    rel,
    children,
    onClick,
    ...props
  },
  ref,
) {
  const resolvedVariant: keyof typeof variants =
    adminAction === 'safe'
      ? 'outline'
      : adminAction && adminAction in variants
        ? (adminAction as keyof typeof variants)
        : variant

  const cls = cn(base, variants[resolvedVariant], sizes[size], className)

  if (to !== undefined) {
    return (
      <NextLink href={to} className={cls} onClick={onClick}>
        {children}
      </NextLink>
    )
  }

  if (href !== undefined) {
    return (
      <a
        ref={ref as Ref<HTMLAnchorElement>}
        href={href}
        className={cls}
        target={target}
        rel={rel}
        onClick={onClick}
      >
        {children}
      </a>
    )
  }

  return (
    <button ref={ref} type={type} className={cls} onClick={onClick} {...props}>
      {children}
    </button>
  )
})
