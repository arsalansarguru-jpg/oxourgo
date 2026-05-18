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
    <div className="w-full space-y-1.5">
      {label ? (
        <label htmlFor={inputId} className="text-sm font-medium text-soft">
          {label}
        </label>
      ) : null}
      <input
        ref={ref}
        id={inputId}
        className={cn(
          'touch-manipulation min-h-11 w-full rounded-full border border-stroke-strong bg-carbon/85 px-4 py-2 text-sm text-soft placeholder:text-muted shadow-[inset_0_1px_0_rgb(255_255_255/0.28)]',
          'transition-[border-color,box-shadow,background-color] duration-200 focus-visible:border-electric focus-visible:bg-carbon focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric/20',
          error && 'border-red-400 focus-visible:border-red-400 focus-visible:ring-red-400/20',
          className,
        )}
        {...props}
      />
      {error ? <p className="text-xs text-red-600 theme-dark:text-red-400">{error}</p> : null}
    </div>
  )
})
