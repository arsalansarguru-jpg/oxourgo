'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/components/providers/theme-provider'
import { cn } from '@/lib/utils/cn'

type ThemeToggleProps = {
  className?: string
  /** Larger hit target for mobile drawer */
  size?: 'default' | 'comfortable'
}

export function ThemeToggle({ className, size = 'default' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme()
  const isLight = theme === 'light'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        'touch-manipulation inline-flex items-center justify-center rounded-xl border border-stroke bg-fill-glass text-soft shadow-[inset_0_1px_0_0_color-mix(in_srgb,var(--color-stroke)_40%,transparent)] transition-[background-color,border-color,transform,color] duration-300 hover:border-stroke-strong hover:bg-fill-glass-strong active:scale-[0.97]',
        size === 'comfortable' ? 'h-12 min-w-[3.25rem] gap-2 px-4 text-[13px] font-medium' : 'h-9 w-9',
        className,
      )}
      aria-label={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
    >
      {size === 'comfortable' ? (
        <>
          {isLight ? (
            <Moon className="h-[18px] w-[18px] shrink-0 text-electric" aria-hidden />
          ) : (
            <Sun className="h-[18px] w-[18px] shrink-0 text-electric" aria-hidden />
          )}
          <span>{isLight ? 'Dark' : 'Light'} mode</span>
        </>
      ) : isLight ? (
        <Moon className="h-[17px] w-[17px]" strokeWidth={2} aria-hidden />
      ) : (
        <Sun className="h-[17px] w-[17px]" strokeWidth={2} aria-hidden />
      )}
    </button>
  )
}
