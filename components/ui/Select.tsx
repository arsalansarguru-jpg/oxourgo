import { forwardRef, type SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string
  error?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, label, error, id, children, ...props },
  ref,
) {
  const selectId = id ?? props.name
  return (
    <div className="w-full space-y-2">
      {label ? (
        <label htmlFor={selectId} className="text-sm font-medium tracking-[-0.01em] text-muted">
          {label}
        </label>
      ) : null}
      <select
        ref={ref}
        id={selectId}
        className={cn(
          'touch-manipulation min-h-12 w-full appearance-none rounded-xl border border-stroke-strong bg-matte/[0.55] px-4 py-3 text-base tracking-[-0.01em] text-soft shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] sm:min-h-11 sm:py-2 sm:text-sm',
          'transition-[border-color,box-shadow,background-color] duration-300 focus-visible:border-electric/55 focus-visible:bg-matte/[0.65] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric/22',
          error && 'border-red-400/50',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      {error ? <p className="text-xs text-red-300">{error}</p> : null}
    </div>
  )
})
