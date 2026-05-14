'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Check, Circle, FileUp, UserRound } from 'lucide-react'

import { DataLoadErrorPanel } from '@/components/ui/data-load-error'
import { EmptyState } from '@/components/ui/EmptyState'
import { KycStatusBadge } from '@/components/kyc/kyc-status-badge'
import { useSupabase } from '@/hooks/use-supabase'
import type { KycDocumentRow } from '@/lib/customer/kyc-queries'
import { pickLatestDocPerType, type KycDocMinimal } from '@/lib/kyc/compute-kyc-profile-status'
import { formatKycDocumentType } from '@/lib/kyc/doc-label'
import type { KycDocumentTypeId } from '@/lib/kyc/constants'
import { KYC_TILES, KycUploadTile } from '@/features/dashboard/kyc-upload-tile'
import { cn } from '@/lib/utils/cn'
import { Badge } from '@/components/ui/Badge'
import { cardSurfaceBase } from '@/components/ui/card-tokens'
import { Button } from '@/components/ui/Button'

export type KycCenterProfileSnapshot = {
  full_name: string | null
  phone: string | null
  avatar_url: string | null
  kyc_status: string
  kyc_submitted_at: string | null
  kyc_approved_at: string | null
}

export function KycCenterClient({
  userId,
  initialDocs,
  initialProfile,
  projectUrl,
  anonKey,
}: {
  userId: string
  initialDocs: KycDocumentRow[]
  initialProfile: KycCenterProfileSnapshot
  projectUrl: string | null
  anonKey: string | null
}) {
  const supabase = useSupabase()
  const [docs, setDocs] = useState(initialDocs)

  useEffect(() => {
    setDocs(initialDocs)
  }, [initialDocs])

  useEffect(() => {
    if (!supabase || !projectUrl || !anonKey) {
      console.error('[KycCenterClient] Secure uploads unavailable: client or public project configuration is incomplete.')
    }
  }, [supabase, projectUrl, anonKey])

  const latestMap = useMemo(() => pickLatestDocPerType(docs as KycDocMinimal[]), [docs])

  const completion = useMemo(() => {
    const profileBasics = Boolean(initialProfile.full_name?.trim() && initialProfile.phone?.trim())
    const license = Boolean(latestMap.get('license'))
    const id = Boolean(latestMap.get('aadhaar') || latestMap.get('pan'))
    const selfie = Boolean(latestMap.get('selfie'))
    const steps = [
      { id: 'profile', label: 'Profile basics', done: profileBasics, hint: 'Full name & phone in settings' },
      { id: 'license', label: 'Driving license', done: license, hint: 'Upload front / combined file' },
      { id: 'id', label: 'Aadhaar or PAN', done: id, hint: 'At least one government ID' },
      { id: 'selfie', label: 'Selfie check', done: selfie, hint: 'Live portrait for liveness' },
    ] as const
    const doneCount = steps.filter((s) => s.done).length
    return { steps, pct: Math.round((doneCount / steps.length) * 100) }
  }, [latestMap, initialProfile.full_name, initialProfile.phone])

  if (!supabase || !projectUrl || !anonKey) {
    return (
      <DataLoadErrorPanel
        title="Unable to open secure uploads"
        description="Document uploads are temporarily unavailable. Please try again later or contact support if this continues."
      />
    )
  }

  const latestForTile = (t: KycDocumentTypeId) => latestMap.get(t) as KycDocumentRow | undefined

  return (
    <div className="min-w-0 space-y-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-electric/90">Trust &amp; vault</p>
          <h1 className="text-2xl font-semibold tracking-[-0.04em] text-soft sm:text-3xl">KYC center</h1>
          <p className="max-w-2xl text-sm text-muted">
            Files upload over an encrypted session into your private vault. We keep only what is needed for verification; our
            operations team reviews submissions through secure tools.
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-3">
          <KycStatusBadge status={initialProfile.kyc_status} />
          <div className="text-xs text-muted">
            {initialProfile.kyc_submitted_at ? (
              <p>First submitted {new Date(initialProfile.kyc_submitted_at).toLocaleString()}</p>
            ) : null}
            {initialProfile.kyc_approved_at ? (
              <p>Approved {new Date(initialProfile.kyc_approved_at).toLocaleString()}</p>
            ) : null}
          </div>
        </div>
      </header>

      <div
        className={cn(
          cardSurfaceBase,
          'overflow-hidden rounded-2xl border border-stroke bg-gradient-to-br from-electric/[0.07] via-matte/40 to-transparent p-5 sm:rounded-3xl sm:p-6',
        )}
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-stroke-strong bg-matte/60">
              <UserRound className="h-6 w-6 text-electric" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="mt-1 max-w-xl text-xs leading-relaxed text-muted">
                Complete each step to move faster through review. Bookings unlock when operations approves your license,
                government ID, and selfie.
              </p>
              <Button type="button" variant="ghost" size="sm" className="mt-3 h-9 px-0 text-electric hover:text-electric/90" to="/dashboard/settings">
                Edit profile basics
              </Button>
            </div>
          </div>
          <div className="w-full max-w-md space-y-2 lg:shrink-0">
            <div className="flex items-center justify-between text-xs font-medium text-muted">
              <span>Overall</span>
              <span className="tabular-nums text-soft">{completion.pct}%</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-fill-glass-strong">
              <div
                className="h-full rounded-full bg-gradient-to-r from-electric via-sky-400 to-emerald transition-[width] duration-500 ease-out"
                style={{ width: `${completion.pct}%` }}
              />
            </div>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {completion.steps.map((s) => (
                <li
                  key={s.id}
                  className="flex items-start gap-2 rounded-xl border border-stroke/80 bg-matte/[0.35] px-3 py-2 text-xs text-muted"
                >
                  {s.done ? (
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald" aria-hidden />
                  ) : (
                    <Circle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted/60" aria-hidden />
                  )}
                  <span>
                    <span className="font-medium text-soft">{s.label}</span>
                    <span className="mt-0.5 block text-[11px] opacity-90">{s.hint}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {KYC_TILES.map((tile) => (
          <KycUploadTile
            key={tile.id}
            tile={tile}
            userId={userId}
            projectUrl={projectUrl}
            anonKey={anonKey}
            supabase={supabase}
            latest={latestForTile(tile.id)}
            onRegistered={(doc) => setDocs((prev) => [doc, ...prev])}
          />
        ))}
      </div>

      <div className={cn(cardSurfaceBase, 'rounded-2xl border border-stroke p-5 sm:rounded-3xl sm:p-6')}>
        <h2 className="text-lg font-semibold text-soft">Submission log</h2>
        <p className="mt-1 text-xs text-muted">
          New uploads append here; the tiles above always reflect your latest file per category.{' '}
          <Link href="/support" className="text-electric hover:underline">
            Questions about verification?
          </Link>
        </p>
        {docs.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              size="compact"
              icon={FileUp}
              title="No uploads in your log yet"
              description="When you submit documents from the tiles above, each upload appears here with a timestamp for your records."
            />
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-stroke text-sm">
            {docs.map((d) => (
              <li key={d.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <span className="font-medium text-soft">{formatKycDocumentType(d.document_type)}</span>
                  {d.original_filename ? (
                    <p className="text-xs text-muted">File: {d.original_filename}</p>
                  ) : null}
                  <p className="text-xs text-muted">
                    Submitted {new Date(d.created_at).toLocaleString()}
                    {d.byte_size != null ? ` · ${(d.byte_size / 1024).toFixed(1)} KB` : null}
                    {d.reviewed_at ? ` · Reviewed ${new Date(d.reviewed_at).toLocaleString()}` : null}
                  </p>
                </div>
                <Badge variant={d.status === 'approved' ? 'success' : d.status === 'rejected' ? 'muted' : 'electric'}>
                  {d.status}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
