import Link from 'next/link'

import { cn } from '@/lib/utils/cn'

export type AdminStatTileProps = {
  label: string
  value: number
  href: string
}

export function AdminStatTile({ label, value, href }: AdminStatTileProps) {
  return (
    <Link
      href={href}
      className={cn(
        'block rounded-lg border border-stroke bg-carbon p-5 shadow-[var(--shadow-card)] transition-colors',
        'hover:border-stroke-strong hover:shadow-[var(--shadow-card-hover)]',
      )}
    >
      <p className="text-sm font-medium text-muted">{label}</p>
      <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-soft">{value}</p>
    </Link>
  )
}
