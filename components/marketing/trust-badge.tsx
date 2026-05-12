import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

type TrustBadgeProps = {
  icon: LucideIcon
  label: string
  className?: string
}

export function TrustBadge({ icon: Icon, label, className }: TrustBadgeProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.04] px-3 py-1.5 text-[11px] font-medium tracking-[-0.01em] text-muted shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] backdrop-blur-sm transition-[border-color,color,background-color] duration-300 hover:border-white/[0.16] hover:bg-white/[0.06] hover:text-soft sm:text-xs',
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0 text-electric" aria-hidden />
      <span>{label}</span>
    </div>
  )
}
