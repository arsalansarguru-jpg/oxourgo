'use client'

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Download, Loader2, RefreshCw, ZoomIn, ZoomOut } from 'lucide-react'

import type { AdminKycReviewBundle, AdminKycReviewDocumentRow } from '@/lib/admin/data/kyc'
import { adminGetKycSignedUrlAction, adminSetKycDocumentStatusAction } from '@/lib/admin/actions/kyc-actions'
import { pickLatestDocPerType, type KycDocMinimal } from '@/lib/kyc/compute-kyc-profile-status'
import { formatKycDocumentType } from '@/lib/kyc/doc-label'
import { AdminStatusPill } from '@/components/admin/admin-status-pill'
import { AdminCard, AdminCardContent } from '@/components/admin/admin-card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { cn } from '@/lib/utils/cn'

const PREVIEW_TTL_SECONDS = 900

const SLOTS: { type: string; title: string }[] = [
  { type: 'license', title: 'Driving license' },
  { type: 'aadhaar', title: 'Aadhaar' },
  { type: 'pan', title: 'PAN card' },
  { type: 'selfie', title: 'Selfie verification' },
  { type: 'passport', title: 'Passport' },
]

function reviewerLine(doc: AdminKycReviewDocumentRow | undefined) {
  if (!doc?.reviewed_at) return null
  const when = new Date(doc.reviewed_at).toLocaleString()
  const who = doc.reviewer_email ?? (doc.reviewed_by ? `Staff ${doc.reviewed_by.slice(0, 8)}…` : 'Staff')
  return `${who} · ${when}`
}

function DocPreview({
  documentId,
  contentType,
}: {
  documentId: string
  contentType: string | null
}) {
  const [url, setUrl] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [zoom, setZoom] = useState(1)
  const [pending, start] = useTransition()

  const load = useCallback(() => {
    start(async () => {
      setLoading(true)
      setErr(null)
      const r = await adminGetKycSignedUrlAction(documentId, PREVIEW_TTL_SECONDS)
      if (!r.ok) {
        setErr(r.message)
        setUrl(null)
        setLoading(false)
        return
      }
      setUrl(r.url)
      setLoading(false)
    })
  }, [documentId])

  useEffect(() => {
    load()
  }, [load])

  const isPdf = (contentType ?? '').includes('pdf')

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 rounded-xl border border-stroke-strong bg-matte/50 p-0.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            disabled={zoom <= 1 || !url || isPdf}
            onClick={() => setZoom((z) => Math.max(1, +(z - 0.25).toFixed(2)))}
            aria-label="Zoom out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="px-2 text-[11px] font-medium tabular-nums text-muted">{Math.round(zoom * 100)}%</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            disabled={zoom >= 2.5 || !url || isPdf}
            onClick={() => setZoom((z) => Math.min(2.5, +(z + 0.25).toFixed(2)))}
            aria-label="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
        {url ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="h-8"
            onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
          >
            <span className="inline-flex items-center gap-1.5">
              <Download className="h-3.5 w-3.5" />
              Open / download
            </span>
          </Button>
        ) : null}
        <Button type="button" variant="ghost" size="sm" className="h-8" disabled={pending} onClick={() => load()}>
          <span className="inline-flex items-center gap-1.5">
            {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Refresh link
          </span>
        </Button>
      </div>

      <div
        className={cn(
          'relative overflow-auto rounded-2xl border border-stroke-strong bg-[#0a0c10]',
          'max-h-[min(70vh,520px)] min-h-[200px]',
        )}
      >
        {loading ? (
          <div className="flex min-h-[220px] flex-col items-center justify-center gap-2 p-8 text-muted">
            <Loader2 className="h-8 w-8 animate-spin text-electric" aria-hidden />
            <p className="text-xs">Preparing secure preview…</p>
          </div>
        ) : err ? (
          <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 p-6 text-center">
            <p className="text-sm text-red-200/95">{err}</p>
            <Button type="button" variant="secondary" size="sm" onClick={() => load()}>
              Try again
            </Button>
          </div>
        ) : url && isPdf ? (
          <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 p-6 text-center">
            <p className="max-w-sm text-sm text-muted">PDF documents open best in a new tab with the signed link.</p>
            <Button type="button" variant="secondary" onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}>
              Open PDF
            </Button>
          </div>
        ) : url ? (
          <div className="flex min-h-[220px] items-center justify-center p-4 sm:p-6">
            {/* eslint-disable-next-line @next/next/no-img-element -- signed URL from private bucket */}
            <img
              src={url}
              alt="KYC document preview"
              className="max-w-none select-none rounded-lg shadow-2xl ring-1 ring-white/10"
              style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
              draggable={false}
            />
          </div>
        ) : null}
      </div>
      <p className="text-[11px] leading-relaxed text-muted">
        Links expire quickly and are not logged in the browser history beyond this session. Do not copy URLs into tickets.
      </p>
    </div>
  )
}

function DocReviewPanel({
  doc,
  title,
}: {
  doc: AdminKycReviewDocumentRow | undefined
  title: string
}) {
  const router = useRouter()
  const [msg, setMsg] = useState<string | null>(null)
  const [pending, start] = useTransition()

  if (!doc) {
    return (
      <AdminCard className="border-dashed border-stroke">
        <AdminCardContent className="p-5 sm:p-6">
          <p className="text-sm font-semibold text-soft">{title}</p>
          <p className="mt-2 text-xs text-muted">No upload in this category yet.</p>
        </AdminCardContent>
      </AdminCard>
    )
  }

  const reviewed = reviewerLine(doc)

  return (
    <AdminCard className="overflow-hidden border-stroke-strong bg-gradient-to-br from-matte/80 via-matte/40 to-electric/[0.04]">
      <AdminCardContent className="space-y-4 p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-1">
            <p className="text-sm font-semibold tracking-tight text-soft">{title}</p>
            <p className="font-mono text-[11px] text-muted">{doc.id}</p>
            <p className="text-xs text-muted">
              Submitted {new Date(doc.created_at).toLocaleString()}
              {doc.updated_at ? ` · Updated ${new Date(doc.updated_at).toLocaleString()}` : null}
            </p>
            {reviewed ? <p className="text-xs text-electric/90">Reviewed: {reviewed}</p> : null}
            {doc.rejection_reason ? (
              <p className="rounded-lg border border-amber-400/20 bg-amber-500/[0.06] px-3 py-2 text-xs text-amber-100/95">
                <span className="font-semibold text-soft">Customer reason: </span>
                {doc.rejection_reason}
              </p>
            ) : null}
            {doc.reviewer_note ? (
              <p className="rounded-lg border border-stroke bg-fill-glass px-3 py-2 text-xs text-muted">
                <span className="font-medium text-soft">Internal note: </span>
                {doc.reviewer_note}
              </p>
            ) : null}
          </div>
          <AdminStatusPill value={doc.status} />
        </div>

        <DocPreview documentId={doc.id} contentType={doc.content_type} />

        <div className="flex flex-wrap gap-2 border-t border-stroke/80 pt-4">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={pending}
            onClick={() => {
              setMsg(null)
              start(async () => {
                const r = await adminSetKycDocumentStatusAction({
                  documentId: doc.id,
                  status: 'reviewing',
                  reviewer_note: null,
                  rejection_reason: null,
                })
                if (!r.ok) setMsg(r.message)
                router.refresh()
              })
            }}
          >
            Mark reviewing
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={pending}
            onClick={() => {
              setMsg(null)
              start(async () => {
                const r = await adminSetKycDocumentStatusAction({
                  documentId: doc.id,
                  status: 'approved',
                  reviewer_note: null,
                  rejection_reason: null,
                })
                if (!r.ok) setMsg(r.message)
                router.refresh()
              })
            }}
          >
            Approve
          </Button>
        </div>

        <form
          className="grid gap-3 rounded-xl border border-stroke bg-matte/[0.35] p-4"
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            const reason = String(fd.get('reject_reason') ?? '').trim()
            const note = String(fd.get('reject_note') ?? '').trim() || null
            setMsg(null)
            start(async () => {
              const r = await adminSetKycDocumentStatusAction({
                documentId: doc.id,
                status: 'rejected',
                rejection_reason: reason,
                reviewer_note: note,
              })
              if (!r.ok) setMsg(r.message)
              router.refresh()
            })
          }}
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Reject</p>
          <textarea
            name="reject_reason"
            required
            rows={2}
            placeholder="Reason shown to the customer (required)"
            className="min-h-[72px] w-full rounded-xl border border-stroke-strong bg-matte/[0.55] px-3 py-2 text-sm text-soft placeholder:text-muted/80 focus-visible:border-electric/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric/22"
          />
          <Input name="reject_note" placeholder="Internal note (optional)" className="min-h-10" />
          <Button type="submit" variant="danger" size="sm" className="w-fit" disabled={pending}>
            Reject document
          </Button>
        </form>

        <form
          className="grid gap-3 rounded-xl border border-stroke bg-matte/[0.35] p-4"
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            const reason = String(fd.get('resubmit_reason') ?? '').trim()
            const note = String(fd.get('resubmit_note') ?? '').trim() || null
            setMsg(null)
            start(async () => {
              const r = await adminSetKycDocumentStatusAction({
                documentId: doc.id,
                status: 'resubmission_required',
                rejection_reason: reason,
                reviewer_note: note,
              })
              if (!r.ok) setMsg(r.message)
              router.refresh()
            })
          }}
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Request resubmission</p>
          <textarea
            name="resubmit_reason"
            required
            rows={2}
            placeholder="What should they fix? (required, customer-visible)"
            className="min-h-[72px] w-full rounded-xl border border-stroke-strong bg-matte/[0.55] px-3 py-2 text-sm text-soft placeholder:text-muted/80 focus-visible:border-electric/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric/22"
          />
          <Input name="resubmit_note" placeholder="Internal note (optional)" className="min-h-10" />
          <Button type="submit" variant="secondary" size="sm" className="w-fit" disabled={pending}>
            Request resubmission
          </Button>
        </form>

        {msg ? <p className="text-xs text-red-300">{msg}</p> : null}
      </AdminCardContent>
    </AdminCard>
  )
}

export function AdminKycReviewView({ bundle }: { bundle: AdminKycReviewBundle }) {
  const { profile, documents } = bundle

  const latest = useMemo(() => pickLatestDocPerType(documents as KycDocMinimal[]) as Map<string, AdminKycReviewDocumentRow>, [documents])

  return (
    <div className="space-y-8">
      <AdminCard>
        <AdminCardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-7">
          <div className="min-w-0 space-y-2">
            <p className="text-lg font-semibold tracking-tight text-soft">{profile.full_name?.trim() || 'Unnamed customer'}</p>
            <p className="text-sm text-muted">{profile.user_email ?? profile.user_id}</p>
            {profile.phone ? <p className="text-xs text-muted">Phone {profile.phone}</p> : null}
            <div className="flex flex-wrap gap-3 text-xs text-muted">
              {profile.kyc_submitted_at ? <span>First submitted {new Date(profile.kyc_submitted_at).toLocaleString()}</span> : null}
              {profile.kyc_approved_at ? <span>Approved {new Date(profile.kyc_approved_at).toLocaleString()}</span> : null}
            </div>
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <AdminStatusPill value={profile.kyc_status} />
            <p className="text-[11px] text-muted">Aggregate status syncs from the latest vault rows.</p>
          </div>
        </AdminCardContent>
      </AdminCard>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-electric/90">Document panels</h2>
        <div className="grid gap-5 lg:grid-cols-2">
          {SLOTS.map((slot) => (
            <DocReviewPanel key={slot.type} title={slot.title} doc={latest.get(slot.type)} />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-electric/90">Full submission history</h2>
        <AdminCard>
          <AdminCardContent className="divide-y divide-stroke p-0">
            {documents.length === 0 ? (
              <p className="p-5 text-sm text-muted">No rows.</p>
            ) : (
              documents.map((d) => (
                <div key={d.id} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 space-y-1">
                    <p className="text-sm font-medium text-soft">{formatKycDocumentType(d.document_type)}</p>
                    <p className="font-mono text-[11px] text-muted">{d.id}</p>
                    <p className="text-xs text-muted">
                      {new Date(d.created_at).toLocaleString()}
                      {d.reviewed_at ? ` · Reviewed ${new Date(d.reviewed_at).toLocaleString()}` : ''}
                    </p>
                  </div>
                  <AdminStatusPill value={d.status} />
                </div>
              ))
            )}
          </AdminCardContent>
        </AdminCard>
      </section>
    </div>
  )
}
