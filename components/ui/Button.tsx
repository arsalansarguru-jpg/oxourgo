'use client'

import { forwardRef, type ButtonHTMLAttributes, type MouseEventHandler, type Ref } from 'react'
import NextLink from 'next/link'
import { cn } from '@/lib/utils/cn'

const variants = {
  primary: 'bg-electric text-white hover:bg-electric/90 active:bg-electric/85',
  secondary:
    'border border-stroke-strong bg-carbon text-soft hover:bg-carbon-deep active:bg-carbon-deep',
  ghost: 'text-soft hover:bg-fill-glass active:bg-fill-glass-strong',
  outline: 'border border-stroke-strong bg-transparent text-soft hover:bg-fill-glass',
  danger:
    'border border-red-200 bg-red-50 text-red-700 theme-dark:border-red-500/35 theme-dark:bg-red-500/15 theme-dark:text-red-200 hover:bg-red-100 theme-dark:hover:bg-red-500/25',
} as const

const sizes = {
  sm: 'min-h-9 px-3.5 py-2 text-sm rounded-md',
  md: 'min-h-10 px-4 py-2 text-sm rounded-md',
  lg: 'min-h-11 px-5 py-2.5 text-sm rounded-md',
} as const

const base =
  'touch-manipulation inline-flex shrink-0 items-center justify-center gap-2 font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric/40 focus-visible:ring-offset-2 focus-visible:ring-offset-matte disabled:pointer-events-none disabled:opacity-40'

export type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'href' | 'onClick'> & {
  variant?: keyof typeof variants
  size?: keyof typeof sizes
  /** Internal app route — renders `next/link` */
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
  const cls = cn(base, variants[variant], sizes[size], className)

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
