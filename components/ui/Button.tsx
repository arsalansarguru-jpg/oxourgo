'use client'

import { forwardRef, type ButtonHTMLAttributes, type MouseEventHandler, type Ref } from 'react'
import NextLink from 'next/link'
import { cn } from '@/lib/utils/cn'

const variants = {
  primary:
    'bg-electric text-white shadow-none hover:bg-electric/90 active:bg-electric/84',
  secondary:
    'border border-stroke-strong bg-carbon/[0.72] text-soft shadow-none hover:border-stroke hover:bg-fill-glass-strong active:bg-fill-glass',
  ghost: 'text-soft hover:bg-fill-glass active:bg-fill-glass-strong',
  outline:
    'border border-stroke-strong bg-transparent text-soft hover:border-stroke-strong hover:bg-fill-glass',
  danger:
    'border border-red-500/35 bg-red-500/15 text-red-200 theme-light:text-red-900 theme-light:bg-red-500/12 theme-light:border-red-600/35 hover:bg-red-500/25 theme-light:hover:bg-red-500/20',
} as const

const sizes = {
  sm: 'min-h-9 px-3.5 py-2 text-sm rounded-lg',
  md: 'min-h-11 px-4 py-2.5 text-sm rounded-lg',
  lg: 'min-h-12 px-5 py-3 text-base rounded-lg',
} as const

const base =
  'touch-manipulation inline-flex shrink-0 items-center justify-center gap-2 font-semibold tracking-[-0.02em] transition-[background-color,border-color,color,box-shadow] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric/45 focus-visible:ring-offset-2 focus-visible:ring-offset-matte theme-light:focus-visible:ring-offset-white disabled:pointer-events-none disabled:opacity-40'

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
