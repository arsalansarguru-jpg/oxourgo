'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/components/providers/theme-provider'
import { cn } from '@/lib/utils/cn'

type ThemeToggleProps = {
  className?: string
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
        'touch-manipulation inline-flex items-center justify-center rounded-xl border border-stroke bg-fill-glass-strong text-soft shadow-[var(--shadow-card)] transition-[border-color,box-shadow,background-color] duration-200 hover:border-electric/35 hover:shadow-[0_0_20px_-10px_var(--glow-electric)]',
        size === 'comfortable' ? 'h-10 gap-2 px-4 text-sm font-medium' : 'h-9 w-9',
        className,
      )}
      aria-label={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
    >
      {size === 'comfortable' ? (
        <>
          {isLight ? <Moon className="h-4 w-4 shrink-0" aria-hidden /> : <Sun className="h-4 w-4 shrink-0" aria-hidden />}
          <span>{isLight ? 'Dark' : 'Light'}</span>
        </>
      ) : isLight ? (
        <Moon className="h-4 w-4" aria-hidden />
      ) : (
        <Sun className="h-4 w-4" aria-hidden />
      )}
    </button>
  )
}
