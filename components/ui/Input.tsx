import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, label, error, id, ...props },
  ref,
) {
  const inputId = id ?? props.name
  return (
    <div className="w-full space-y-2">
      {label ? (
        <label htmlFor={inputId} className="text-sm font-medium tracking-[-0.01em] text-muted">
          {label}
        </label>
      ) : null}
      <input
        ref={ref}
        id={inputId}
        className={cn(
          'touch-manipulation min-h-12 w-full rounded-xl border border-white/[0.12] bg-matte/[0.55] px-4 py-3 text-base tracking-[-0.01em] text-soft shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] placeholder:text-muted/80 sm:min-h-11 sm:py-2 sm:text-sm',
          'transition-[border-color,box-shadow,background-color] duration-300 focus:border-electric/55 focus:bg-matte/[0.65] focus:outline-none focus:ring-2 focus:ring-electric/22',
          error && 'border-red-400/50 focus:border-red-400/60 focus:ring-red-400/20',
          className,
        )}
        {...props}
      />
      {error ? <p className="text-xs text-red-300">{error}</p> : null}
    </div>
  )
})
