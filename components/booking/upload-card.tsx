import { UploadCloud } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Badge } from '@/components/ui/Badge'
import { cardSurfaceDashed, cardTitle } from '@/components/ui/card-tokens'

type UploadCardProps = {
  title: string
  description: string
  status?: 'idle' | 'uploading' | 'complete' | 'error'
  onSelect?: () => void
  className?: string
}

export function UploadCard({
  title,
  description,
  status = 'idle',
  onSelect,
  className,
}: UploadCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'group/card w-full text-left',
        cardSurfaceDashed,
        'p-4 sm:p-5',
        'hover:border-electric/30 hover:bg-carbon/[0.48] hover:shadow-[0_1px_0_0_rgba(255,255,255,0.05)_inset,var(--shadow-card)]',
        'active:scale-[0.99]',
        status === 'complete' && 'border-emerald/30 bg-emerald/[0.06] hover:border-emerald/40',
        status === 'error' && 'border-red-400/35 bg-red-500/[0.06] hover:border-red-400/45',
        className,
      )}
    >
      <div className="flex w-full items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3 sm:gap-4">
          <span
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-stroke bg-matte/[0.5] text-electric shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] transition-[border-color,background-color] duration-300',
              'group-hover/card:border-stroke-strong group-hover/card:bg-matte/[0.58]',
            )}
          >
            <UploadCloud className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className={cn(cardTitle, 'text-base')}>{title}</p>
            <p className="mt-1 text-sm leading-relaxed text-muted">{description}</p>
          </div>
        </div>
        {status === 'complete' ? (
          <Badge variant="success">Verified</Badge>
        ) : status === 'uploading' ? (
          <Badge variant="electric">Uploading</Badge>
        ) : status === 'error' ? (
          <Badge variant="danger">Retry</Badge>
        ) : (
          <Badge variant="muted">Tap to upload</Badge>
        )}
      </div>
    </button>
  )
}
