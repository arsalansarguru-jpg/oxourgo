'use client'

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Download, Loader2, RefreshCw, ZoomIn, ZoomOut } from 'lucide-react'

import type { AdminKycReviewBundle, AdminKycReviewDocumentRow } from '@/lib/admin/data/kyc'
import { AdminConfirmDialog } from '@/components/admin/operations/admin-confirm-dialog'
import { adminGetKycSignedUrlAction, adminSetKycDocumentStatusAction } from '@/lib/admin/actions/kyc-actions'
import { pickLatestDocPerType, type KycDocMinimal } from '@/lib/kyc/compute-kyc-profile-status'
import { formatKycDocumentType } from '@/lib/kyc/doc-label'
import { resolveKycPreviewContentType } from '@/lib/kyc/content-type-from-path'
import { isBrowserPreviewableImage, kycPreviewNotSupportedMessage } from '@/lib/kyc/preview'
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
  const who = doc.reviewed_by ? `Reviewer ${doc.reviewed_by.slice(0, 8)}…` : 'Staff reviewer'
  return `${who} · ${when}`
}

function DocPreview({
  documentId,
  contentType,
  storagePath,
}: {
  documentId: string
  contentType: string | null
  storagePath: string | null
}) {
  const [url, setUrl] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [zoom, setZoom] = useState(1)
  const [pending, start] = useTransition()
  const [resolvedType, setResolvedType] = useState<string | null>(() =>
    storagePath ? resolveKycPreviewContentType(storagePath, contentType) : contentType,
  )

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
      setResolvedType(
        r.contentType ??
          (storagePath ? resolveKycPreviewContentType(storagePath, contentType) : contentType),
      )
      setLoading(false)
    })
  }, [documentId, contentType, storagePath])

  useEffect(() => {
    load()
  }, [load])

  const mime = resolvedType ?? contentType
  const isPdf = (mime ?? '').includes('pdf')
  const previewBlocked =
    kycPreviewNotSupportedMessage(mime) ??
    (!isBrowserPreviewableImage(mime) && !isPdf ? kycPreviewNotSupportedMessage('application/octet-stream') : null)
  const canInlinePreview = Boolean(url && !loading && !err && !isPdf && !previewBlocked && isBrowserPreviewableImage(mime))

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 rounded-xl border border-stroke-strong bg-matte/50 p-0.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            disabled={zoom <= 1 || !canInlinePreview}
            title={zoom <= 1 ? 'Already at minimum zoom (100%)' : 'Zoom out'}
            onClick={() => setZoom((z) => Math.max(1, +(z - 0.25).toFixed(2)))}
            aria-label={zoom <= 1 ? 'Zoom out (disabled at minimum zoom)' : 'Zoom out'}
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
          'relative overflow-auto rounded-2xl border border-stroke-strong bg-neutral-100',
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
        ) : url && (isPdf || previewBlocked) ? (
          <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 p-6 text-center">
            <p className="max-w-sm text-sm text-muted">
              {previewBlocked ?? 'PDF documents open best in a new tab with the signed link.'}
            </p>
            <Button type="button" variant="secondary" onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}>
              {isPdf ? 'Open PDF' : 'Open / download'}
            </Button>
          </div>
        ) : canInlinePreview && url ? (
          <div className="flex min-h-[220px] items-center justify-center p-4 sm:p-6">
            {/* eslint-disable-next-line @next/next/no-img-element -- signed URL from private bucket */}
            <img
              src={url}
              alt="KYC document preview"
              className="max-h-[min(68vh,480px)] max-w-full select-none rounded-md object-contain"
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: 'center center',
                imageRendering: 'auto',
              }}
              decoding="async"
              draggable={false}
              onError={() => {
                setErr('Preview could not render this file. Use Open / download to view the original.')
                setUrl(null)
              }}
            />
          </div>
        ) : url ? (
          <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 p-6 text-center">
            <p className="max-w-sm text-sm text-muted">
              {previewBlocked ?? 'Inline preview is not available for this file.'}
            </p>
            <Button type="button" variant="secondary" onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}>
              Open / download
            </Button>
          </div>
        ) : null}
      </div>
      <p className="text-[11px] leading-relaxed text-muted">
        Links expire quickly and are not logged in the browser history beyond this session. Do not copy URLs into tickets.
        If the preview looks grainy or soft, open the original file — quality depends on the customer upload, not admin filters.
      </p>
    </div>
  )
}

type PendingAction =
  | { kind: 'approve' }
  | { kind: 'reject'; reason: string; note: string | null }
  | { kind: 'resubmit'; reason: string; note: string | null }
  | { kind: 'reviewing' }

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
  const [confirm, setConfirm] = useState<PendingAction | null>(null)
  const panelId = doc?.id ?? title.replace(/\s+/g, '-').toLowerCase()

  const runDecision = (action: PendingAction) => {
    if (!doc) return
    setMsg(null)
    start(async () => {
      const payload =
        action.kind === 'approve'
          ? {
              documentId: doc.id,
              status: 'approved' as const,
              reviewer_note: null,
              rejection_reason: null,
            }
          : action.kind === 'reviewing'
            ? {
                documentId: doc.id,
                status: 'reviewing' as const,
                reviewer_note: null,
                rejection_reason: null,
              }
            : action.kind === 'reject'
              ? {
                  documentId: doc.id,
                  status: 'rejected' as const,
                  rejection_reason: action.reason,
                  reviewer_note: action.note,
                }
              : {
                  documentId: doc.id,
                  status: 'resubmission_required' as const,
                  rejection_reason: action.reason,
                  reviewer_note: action.note,
                }

      const r = await adminSetKycDocumentStatusAction(payload)
      if (!r.ok) setMsg(r.message)
      setConfirm(null)
      router.refresh()
    })
  }

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
  const isApproved = doc.status === 'approved'
  const isTerminal = isApproved || doc.status === 'rejected'
  const canMarkReviewing = !isApproved && doc.status !== 'reviewing'

  const guardApprovedAction = (action: () => void) => {
    if (isApproved) return
    action()
  }

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
          <AdminStatusPill value={doc.status} kycDocument />
        </div>

        <DocPreview documentId={doc.id} contentType={doc.content_type} storagePath={doc.storage_path} />

        {isApproved ? (
          <p className="rounded-lg border border-emerald-400/25 bg-emerald-500/[0.06] px-3 py-2 text-xs text-emerald-100/95">
            This document is approved. Use Reject or Request resubmission only if you need to reverse the decision.
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2 border-t border-stroke/80 pt-4">
          {isApproved ? (
            <p className="text-xs text-muted">Approval actions are locked. Use Reject or Request resubmission below to reverse.</p>
          ) : (
            <>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={pending || !canMarkReviewing}
                aria-disabled={pending || !canMarkReviewing}
                title={!canMarkReviewing ? 'Already in review' : undefined}
                onClick={() => guardApprovedAction(() => setConfirm({ kind: 'reviewing' }))}
              >
                Mark reviewing
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={pending || isApproved}
                aria-disabled={pending || isApproved}
                onClick={() => guardApprovedAction(() => setConfirm({ kind: 'approve' }))}
              >
                Approve
              </Button>
            </>
          )}
        </div>

        <form
          className={cn(
            'grid gap-3 rounded-xl border border-stroke bg-matte/[0.35] p-4',
            isTerminal && 'opacity-80',
          )}
          onSubmit={(e) => {
            e.preventDefault()
            if (isApproved) return
            const fd = new FormData(e.currentTarget)
            const reason = String(fd.get('reject_reason') ?? '').trim()
            const note = String(fd.get(`reject_note_${panelId}`) ?? '').trim() || null
            if (!reason) return
            setConfirm({ kind: 'reject', reason, note })
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
          <Input
            id={`reject_note_${panelId}`}
            name={`reject_note_${panelId}`}
            placeholder="Internal note (optional)"
            className="min-h-10"
          />
          <Button type="submit" variant="danger" size="sm" className="w-fit" disabled={pending || isApproved}>
            Reject document
          </Button>
        </form>

        <form
          className={cn(
            'grid gap-3 rounded-xl border border-stroke bg-matte/[0.35] p-4',
            isApproved && 'opacity-80',
          )}
          onSubmit={(e) => {
            e.preventDefault()
            if (isApproved) return
            const fd = new FormData(e.currentTarget)
            const reason = String(fd.get('resubmit_reason') ?? '').trim()
            const note = String(fd.get(`resubmit_note_${panelId}`) ?? '').trim() || null
            if (!reason) return
            setConfirm({ kind: 'resubmit', reason, note })
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
          <Input
            id={`resubmit_note_${panelId}`}
            name={`resubmit_note_${panelId}`}
            placeholder="Internal note (optional)"
            className="min-h-10"
          />
          <Button type="submit" variant="secondary" size="sm" className="w-fit" disabled={pending || isApproved}>
            Request resubmission
          </Button>
        </form>

        <AdminConfirmDialog
          open={confirm != null}
          onClose={() => setConfirm(null)}
          pending={pending}
          variant={confirm?.kind === 'approve' || confirm?.kind === 'reviewing' ? 'primary' : 'danger'}
          title={
            confirm?.kind === 'approve'
              ? 'Approve this document?'
              : confirm?.kind === 'reviewing'
                ? 'Mark as reviewing?'
                : confirm?.kind === 'reject'
                  ? 'Reject this document?'
                  : confirm?.kind === 'resubmit'
                    ? 'Request resubmission?'
                    : 'Confirm action'
          }
          description={
            confirm?.kind === 'approve'
              ? `This will approve ${title} and update the customer’s KYC status.`
              : confirm?.kind === 'reviewing'
                ? `Mark ${title} as in review without changing the customer-visible outcome.`
                : confirm?.kind === 'reject'
                  ? 'The customer will see your rejection reason. This cannot be undone from the admin UI.'
                  : confirm?.kind === 'resubmit'
                    ? 'The customer will be asked to upload again with your note.'
                    : ''
          }
          confirmLabel={
            confirm?.kind === 'approve'
              ? 'Approve'
              : confirm?.kind === 'reviewing'
                ? 'Mark reviewing'
                : confirm?.kind === 'reject'
                  ? 'Reject'
                  : confirm?.kind === 'resubmit'
                    ? 'Request resubmission'
                    : 'Confirm'
          }
          onConfirm={() => {
            if (confirm) runDecision(confirm)
          }}
        />

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
            <AdminStatusPill value={profile.kyc_status} kycProfile />
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
                  <AdminStatusPill value={d.status} kycDocument />
                </div>
              ))
            )}
          </AdminCardContent>
        </AdminCard>
      </section>
    </div>
  )
}
