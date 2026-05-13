'use client'

import { useEffect, useState } from 'react'

import { useSupabase } from '@/hooks/use-supabase'
import type { KycDocumentRow } from '@/lib/customer/kyc-queries'
import { formatKycDocumentType } from '@/lib/kyc/doc-label'
import { KYC_TILES, KycUploadTile } from '@/features/dashboard/kyc-upload-tile'
import type { KycDocumentTypeId } from '@/lib/kyc/constants'
import { cn } from '@/lib/utils/cn'
import { Badge } from '@/components/ui/Badge'
import { cardSurfaceBase } from '@/components/ui/card-tokens'

export function KycCenterClient({
  userId,
  initialDocs,
  projectUrl,
  anonKey,
}: {
  userId: string
  initialDocs: KycDocumentRow[]
  projectUrl: string | null
  anonKey: string | null
}) {
  const supabase = useSupabase()
  const [docs, setDocs] = useState(initialDocs)

  useEffect(() => {
    setDocs(initialDocs)
  }, [initialDocs])

  if (!supabase || !projectUrl || !anonKey) {
    return (
      <p className="text-sm text-amber-200/90">
        Supabase is not configured in the browser — set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or
        publishable key) in `.env.local` to enable secure uploads.
      </p>
    )
  }

  const latestByType = (t: KycDocumentTypeId) => docs.find((d) => d.document_type === t)

  return (
    <div className="space-y-8">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-electric/90">Trust &amp; vault</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-soft">KYC center</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Files upload directly to your private Supabase Storage prefix (
          <code className="rounded bg-fill-glass-strong px-1 font-mono text-xs">kyc/&lt;your-account-id&gt;/…</code>) with your
          session token. We store the storage path and metadata in{' '}
          <code className="rounded bg-fill-glass-strong px-1 font-mono text-xs">kyc_documents</code> for verification. Operations
          staff review using admin tools; objects are not world-readable.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {KYC_TILES.map((tile) => (
          <KycUploadTile
            key={tile.id}
            tile={tile}
            userId={userId}
            projectUrl={projectUrl}
            anonKey={anonKey}
            supabase={supabase}
            latest={latestByType(tile.id)}
            onRegistered={(doc) => setDocs((prev) => [doc, ...prev])}
          />
        ))}
      </div>

      <div className={cn(cardSurfaceBase, 'rounded-2xl border border-stroke p-5 sm:rounded-3xl sm:p-6')}>
        <h2 className="text-lg font-semibold text-soft">Submission log</h2>
        <p className="mt-1 text-xs text-muted">New uploads append here; the tiles above always reflect your latest file per category.</p>
        {docs.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No uploads yet.</p>
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
                    {new Date(d.created_at).toLocaleString()}
                    {d.byte_size != null ? ` · ${(d.byte_size / 1024).toFixed(1)} KB` : null}
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
