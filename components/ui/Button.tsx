'use client'

import { forwardRef, type ButtonHTMLAttributes, type MouseEventHandler, type Ref } from 'react'
import NextLink from 'next/link'
import { cn } from '@/lib/utils/cn'

const variants = {
  primary:
    'bg-electric text-white shadow-[0_14px_40px_-22px_rgba(59,130,246,0.55)] hover:shadow-glow-strong hover:brightness-[1.07] active:brightness-[0.96]',
  secondary:
    'border border-stroke-strong bg-fill-glass-strong text-soft shadow-[inset_0_1px_0_0_color-mix(in_srgb,var(--color-stroke)_50%,transparent)] hover:border-stroke-strong hover:bg-fill-glass active:bg-fill-glass',
  ghost: 'text-soft hover:bg-fill-glass active:bg-fill-glass-strong',
  outline:
    'border border-stroke-strong bg-transparent text-soft hover:border-electric/45 hover:bg-electric/[0.06] hover:text-soft',
  danger:
    'border border-red-500/35 bg-red-500/15 text-red-200 theme-light:text-red-900 theme-light:bg-red-500/12 theme-light:border-red-600/35 hover:bg-red-500/25 theme-light:hover:bg-red-500/20',
} as const

const sizes = {
  sm: 'min-h-11 px-4 py-2 text-[13px] rounded-lg md:min-h-9 md:py-0 md:text-sm',
  md: 'min-h-12 px-[1.125rem] py-2.5 text-sm rounded-xl md:min-h-[2.875rem] md:px-5 md:py-0',
  lg: 'min-h-[3.25rem] px-6 py-3 text-base rounded-xl md:min-h-[3.125rem] md:py-0',
} as const

const base =
  'touch-manipulation inline-flex shrink-0 items-center justify-center gap-2 font-semibold tracking-[-0.02em] transition-[transform,box-shadow,background-color,border-color,color,filter] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric focus-visible:ring-offset-2 focus-visible:ring-offset-matte theme-light:focus-visible:ring-offset-white hover:-translate-y-px active:translate-y-0 disabled:pointer-events-none disabled:opacity-40 active:scale-[0.98] md:active:scale-100'

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
