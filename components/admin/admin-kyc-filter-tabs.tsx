import Link from 'next/link'

import type { AdminKycListFilter } from '@/lib/admin/data/kyc'
import { cn } from '@/lib/utils/cn'

const TABS: { id: AdminKycListFilter; label: string }[] = [
  { id: 'pending', label: 'In review' },
  { id: 'resubmission_required', label: 'Resubmit' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'all', label: 'All activity' },
]

export function AdminKycFilterTabs({ active }: { active: AdminKycListFilter }) {
  return (
    <nav
      className="flex flex-wrap gap-2 rounded-2xl border border-stroke-strong bg-matte/[0.35] p-1.5 sm:inline-flex sm:flex-nowrap"
      aria-label="KYC verification filters"
    >
      {TABS.map((t) => {
        const on = t.id === active
        return (
          <Link
            key={t.id}
            href={t.id === 'pending' ? '/admin/kyc' : `/admin/kyc?tab=${t.id}`}
            scroll={false}
            className={cn(
              'rounded-xl px-3.5 py-2 text-xs font-semibold uppercase tracking-wide transition-colors sm:px-4',
              on
                ? 'bg-gradient-to-br from-electric/25 to-sky-500/10 text-soft shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]'
                : 'text-muted hover:bg-fill-glass-strong hover:text-soft',
            )}
          >
            {t.label}
          </Link>
        )
      })}
    </nav>
  )
}
