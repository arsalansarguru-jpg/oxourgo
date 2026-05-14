import Link from 'next/link'

import { cn } from '@/lib/utils/cn'

export type AdminStatTileProps = {
  label: string
  value: number
  href: string
}

/** Premium analytics tile for the admin overview grid. */
export function AdminStatTile({ label, value, href }: AdminStatTileProps) {
  return (
    <Link href={href} className="group relative block outline-none">
      <div
        className={cn(
          'relative overflow-hidden rounded-2xl border border-white/[0.07] bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-6 shadow-[var(--shadow-card)] ring-1 ring-inset ring-white/[0.04] transition-[transform,box-shadow,border-color,ring-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
          'before:pointer-events-none before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-br before:from-electric/15 before:via-transparent before:to-transparent before:opacity-0 before:transition-opacity before:duration-300 group-hover:before:opacity-100',
          'hover:-translate-y-0.5 hover:border-electric/25 hover:shadow-[var(--shadow-card-accent)] hover:ring-electric/15',
        )}
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{label}</p>
        <p className="mt-4 text-4xl font-semibold tabular-nums tracking-[-0.04em] text-soft lg:text-[2.75rem]">{value}</p>
        <p className="mt-4 text-[11px] font-medium text-electric opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          Open →
        </p>
      </div>
    </Link>
  )
}
