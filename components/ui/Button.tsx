'use client'

import { forwardRef, type ButtonHTMLAttributes, type MouseEventHandler, type Ref } from 'react'
import NextLink from 'next/link'
import { cn } from '@/lib/utils/cn'

const variants = {
  primary:
    'border border-electric/70 bg-[linear-gradient(135deg,#d8b06d,#b98743)] text-[#161009] shadow-[0_16px_34px_-24px_rgba(185,135,67,0.9)] hover:brightness-105 active:brightness-95',
  secondary:
    'border border-stroke-strong bg-carbon/80 text-soft shadow-[inset_0_1px_0_rgb(255_255_255/0.28)] hover:bg-carbon-deep active:bg-carbon-deep',
  ghost: 'text-soft hover:bg-fill-glass active:bg-fill-glass-strong',
  outline: 'border border-stroke-strong bg-transparent text-soft hover:bg-fill-glass',
  danger:
    'border border-red-200 bg-red-50 text-red-700 theme-dark:border-red-500/35 theme-dark:bg-red-500/15 theme-dark:text-red-200 hover:bg-red-100 theme-dark:hover:bg-red-500/25',
} as const

const sizes = {
  sm: 'min-h-10 px-3.5 py-2 text-sm rounded-full',
  md: 'min-h-11 px-4 py-2 text-sm rounded-full',
  lg: 'min-h-12 px-6 py-3 text-sm rounded-full',
} as const

const base =
  'touch-manipulation inline-flex shrink-0 items-center justify-center gap-2 font-semibold transition-[transform,filter,background-color,border-color,box-shadow] duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric/40 focus-visible:ring-offset-2 focus-visible:ring-offset-matte disabled:pointer-events-none disabled:translate-y-0 disabled:opacity-40'

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
