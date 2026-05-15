import { Archive } from 'lucide-react'

import { cn } from '@/lib/utils/cn'

type Props = {
  className?: string
  label?: string
}

/** Indicates a record is archived (soft-deleted) and recoverable. */
export function AdminArchiveBadge({ className, label = 'Archived' }: Props) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-amber-200',
        className,
      )}
    >
      <Archive className="h-3 w-3" aria-hidden />
      {label}
    </span>
  )
}
