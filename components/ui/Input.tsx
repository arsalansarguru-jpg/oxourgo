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
        aria-invalid={error ? 'true' : 'false'}
        className={cn(
          'touch-manipulation min-h-11 w-full rounded-xl border border-stroke-strong bg-carbon/90 px-4 py-2.5 text-base font-normal text-soft placeholder:text-muted backdrop-blur-sm sm:text-sm',
          'shadow-[inset_0_1px_0_rgb(255_255_255/0.06)] transition-[border-color,box-shadow,background-color] duration-200',
          'focus-visible:border-electric focus-visible:bg-carbon focus-visible:shadow-none',
          'theme-light:bg-white theme-light:shadow-[0_8px_24px_-16px_rgb(0_31_84/0.12)]',
          error && 'border-red-400 focus-visible:border-red-400',
          className,
        )}
        {...props}
      />
      {error ? (
        <p className="text-xs font-semibold text-red-400 theme-light:text-red-700">{error}</p>
      ) : null}
    </div>
  )
})
