'use client'

import { Badge } from '@/components/ui/Badge'
import type { KycLifecycleStatus } from '@/lib/kyc/compute-kyc-profile-status'

const LABELS: Record<KycLifecycleStatus, string> = {
  not_started: 'KYC · Not started',
  pending: 'KYC · In review',
  approved: 'KYC · Approved',
  rejected: 'KYC · Action needed',
}

export function KycStatusBadge({
  status,
  className,
}: {
  status: string | null | undefined
  className?: string
}) {
  const raw = (status ?? 'not_started').trim().toLowerCase()
  const s = (['not_started', 'pending', 'approved', 'rejected'].includes(raw) ? raw : 'not_started') as KycLifecycleStatus
  const variant =
    s === 'approved' ? 'success' : s === 'rejected' ? 'muted' : s === 'pending' ? 'electric' : 'default'
  return (
    <Badge variant={variant} className={className}>
      {LABELS[s]}
    </Badge>
  )
}
