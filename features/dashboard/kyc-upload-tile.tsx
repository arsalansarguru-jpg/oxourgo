'use client'

import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { SupabaseClient } from '@supabase/supabase-js'
import { Check, Eye, FileUp, Loader2, ShieldCheck } from 'lucide-react'

import { registerKycDocumentAction } from '@/app/(main)/dashboard/actions'
import { captureClientEvent } from '@/lib/analytics/capture-client'
import { POSTHOG_EVENTS } from '@/lib/analytics/posthog-events'
import type { KycDocumentRow } from '@/lib/customer/kyc-queries'
import type { Database } from '@/lib/supabase/database.types'
import type { KycDocumentTypeId } from '@/lib/kyc/constants'
import { KYC_ID_ACCEPT, KYC_MAX_FILE_BYTES, KYC_SELFIE_ACCEPT } from '@/lib/kyc/constants'
import { inferKycContentType, isAllowedKycMime } from '@/lib/kyc/mime'
import { buildKycObjectPath } from '@/lib/kyc/object-path'
import { mapUnknownToKycUpload, safeMessageForKycUploadCode } from '@/lib/kyc/upload-errors'
import { uploadKycObjectWithProgress } from '@/lib/kyc/upload-kyc-browser'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent } from '@/components/ui/Card'
import { cardSurfaceBase, cardSurfaceHover, cardSurfaceTransition } from '@/components/ui/card-tokens'

export type KycTileConfig = {
  id: KycDocumentTypeId
  label: string
  hint: string
  accept: string
  selfie?: boolean
  /** When false, tile is optional (e.g. passport for domestic renters). */
  required?: boolean
}

function sanitizeFilename(name: string): string {
  const base = name.replace(/[/\\]/g, '').replace(/\s+/g, ' ').trim()
  return base.slice(0, 180) || 'upload'
}

function validateFile(file: File, acceptSelfie: boolean): string | null {
  if (file.size <= 0) return 'File is empty.'
  if (file.size > KYC_MAX_FILE_BYTES) {
    return `File must be ${Math.round(KYC_MAX_FILE_BYTES / (1024 * 1024))}MB or smaller.`
  }
  const mime = inferKycContentType(file)
  if (!isAllowedKycMime(mime, acceptSelfie)) {
    return acceptSelfie
      ? 'Selfie must be an image (JPEG, PNG, or WebP).'
      : 'Please upload a PDF or an image (JPEG, PNG, or WebP).'
  }
  return null
}

export function KycUploadTile({
  tile,
  userId,
  supabase,
  latest,
  onRegistered,
}: {
  tile: KycTileConfig
  userId: string
  supabase: SupabaseClient<Database>
  latest: KycDocumentRow | undefined
  onRegistered: (doc: KycDocumentRow) => void
}) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const lastFileRef = useRef<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [progress, setProgress] = useState<number | null>(null)
  const [localError, setLocalError] = useState<string | null>(null)
  const [successFlash, setSuccessFlash] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [previewPending, startPreview] = useTransition()

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const replacePreview = useCallback(
    (file: File | null) => {
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        if (!file) return null
        if (!file.type.startsWith('image/')) return null
        return URL.createObjectURL(file)
      })
    },
    [],
  )

  const busy = pending || progress !== null

  const processFile = useCallback(
    (file: File | null | undefined) => {
      if (!file) return
      const err = validateFile(file, Boolean(tile.selfie))
      if (err) {
        setLocalError(err)
        return
      }
      setLocalError(null)
      lastFileRef.current = file
      replacePreview(file)
      startTransition(async () => {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()
        if (userError || !user) {
          setLocalError('Your session expired. Sign in again.')
          return
        }
        if (user.id !== userId) {
          console.error('[KycUploadTile] auth user id mismatch', { authUserId: user.id, userId })
          setLocalError('Your session does not match this account. Sign in again.')
          return
        }

        const objectPath = buildKycObjectPath(userId, tile.id, file)
        const contentType = inferKycContentType(file)

        if (process.env.NODE_ENV === 'development') {
          console.info('[KycUploadTile] upload start', {
            bucket: 'kyc',
            objectPath,
            authUserId: user.id,
            contentType,
            byteSize: file.size,
          })
        }

        setProgress(0)
        try {
          await uploadKycObjectWithProgress({
            supabase,
            objectPath,
            file,
            onProgress: (r) => setProgress(r),
          })

          const res = await registerKycDocumentAction({
            documentType: tile.id,
            storagePath: objectPath,
            byteSize: file.size,
            contentType,
            originalFilename: sanitizeFilename(file.name),
          })

          if (!res.ok) {
            await supabase.storage.from('kyc').remove([objectPath]).catch(() => {})
            setLocalError(res.message ?? 'Could not save document metadata.')
            setProgress(null)
            return
          }

          captureClientEvent(POSTHOG_EVENTS.kycSubmissionSuccess, {
            document_type: tile.id,
            byte_size_bucket:
              file.size < 500_000 ? 'lt_500kb' : file.size < 2_000_000 ? '500kb_2mb' : '2mb_plus',
          })

          if (res.document) {
            onRegistered(res.document)
          }
          setProgress(null)
          replacePreview(null)
          lastFileRef.current = null
          setSuccessFlash(true)
          window.setTimeout(() => setSuccessFlash(false), 3200)
          router.refresh()
        } catch (e) {
          setProgress(null)
          const mapped = mapUnknownToKycUpload(e)
          console.error('[KycUploadTile] upload or register failed', {
            code: mapped.code,
            message: mapped.message,
            raw: e,
          })
          setLocalError(safeMessageForKycUploadCode(mapped.code))
        }
      })
    },
    [onRegistered, replacePreview, router, supabase, tile.id, tile.selfie, userId],
  )

  const onBrowse = () => inputRef.current?.click()

  return (
    <Card
      className={cn(
        cardSurfaceTransition,
        cardSurfaceHover,
        dragOver && 'ring-2 ring-electric/50 ring-offset-2 ring-offset-matte',
      )}
    >
      <CardContent className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 shrink-0 text-electric" aria-hidden />
            <div>
              <h2 className="font-semibold text-soft">{tile.label}</h2>
              <p className="text-xs text-muted">{tile.hint}</p>
            </div>
          </div>
          {latest ? (
            <Badge
              variant={
                latest.status === 'approved'
                  ? 'success'
                  : latest.status === 'rejected'
                    ? 'muted'
                    : latest.status === 'resubmission_required'
                      ? 'electric'
                      : 'electric'
              }
            >
              {latest.status.replace(/_/g, ' ')}
            </Badge>
          ) : (
            <Badge variant={tile.required === false ? 'default' : 'muted'}>
              {tile.required === false ? 'Optional' : 'Required'}
            </Badge>
          )}
        </div>

        <div
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              if (!busy) onBrowse()
            }
          }}
          onDragEnter={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setDragOver(true)
          }}
          onDragOver={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
          onDragLeave={(e) => {
            e.preventDefault()
            e.stopPropagation()
            if (e.currentTarget === e.target) setDragOver(false)
          }}
          onDrop={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setDragOver(false)
            if (busy) return
            processFile(e.dataTransfer.files?.[0])
          }}
          className={cn(
            cardSurfaceBase,
            'rounded-xl border border-dashed border-stroke-strong bg-matte/[0.35] p-6 text-center transition-[border-color,background-color,box-shadow] duration-300',
            dragOver && 'border-electric/45 bg-electric/[0.06]',
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept={tile.accept}
            className="hidden"
            disabled={busy}
            onChange={(e) => {
              processFile(e.target.files?.[0])
              e.target.value = ''
            }}
          />
          {successFlash ? (
            <div className="flex flex-col items-center gap-2 py-2 text-emerald">
              <Check className="h-8 w-8" aria-hidden />
              <p className="text-sm font-semibold text-soft">Uploaded securely</p>
              <p className="text-xs text-muted">Your file is in your private vault. We will review it shortly.</p>
            </div>
          ) : progress !== null ? (
            <div className="space-y-3">
              <p className="text-sm font-medium text-soft">Uploading…</p>
              <div className="h-2 w-full overflow-hidden rounded-full bg-fill-glass-strong">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-electric to-sky-400 transition-[width] duration-150 ease-out"
                  style={{ width: `${Math.round(progress * 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted tabular-nums">{Math.round(progress * 100)}%</p>
            </div>
          ) : (
            <div className="space-y-4">
              {previewUrl ? (
                <div className="overflow-hidden rounded-lg border border-stroke bg-matte/40 p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
                  <img src={previewUrl} alt="" role="presentation" className="mx-auto max-h-44 w-full object-contain" />
                </div>
              ) : lastFileRef.current && !lastFileRef.current.type.startsWith('image/') ? (
                <p className="text-xs text-muted">
                  PDF selected: <span className="font-medium text-soft">{lastFileRef.current.name}</span>
                </p>
              ) : null}
              <div className="space-y-3">
                <p className="text-sm text-soft">Drag &amp; drop here, or browse</p>
                <p className="text-xs text-muted">Private bucket · encrypted in transit · max 8MB</p>
                <Button type="button" variant="secondary" className="w-full" disabled={busy} onClick={onBrowse}>
                  <span className="inline-flex items-center gap-2">
                    <FileUp className="h-4 w-4" aria-hidden />
                    Choose file
                  </span>
                </Button>
              </div>
            </div>
          )}
        </div>

        {localError ? (
          <div className="space-y-2">
            <p className="rounded-lg border border-red-400/25 bg-red-500/[0.08] px-3 py-2 text-xs text-red-100/95">
              {localError}
            </p>
            {lastFileRef.current ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="w-full"
                disabled={busy}
                onClick={() => {
                  setLocalError(null)
                  const f = lastFileRef.current
                  if (f) processFile(f)
                }}
              >
                Try again
              </Button>
            ) : null}
          </div>
        ) : null}

        {latest?.storage_path ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full"
            disabled={busy || previewPending}
            onClick={() => {
              startPreview(async () => {
                const { data, error } = await supabase.storage.from('kyc').createSignedUrl(latest.storage_path, 120)
                if (error || !data?.signedUrl) {
                  console.error('[KycUploadTile] signed URL failed', error?.message, error?.name)
                  setLocalError('Could not open a secure preview link. Try again in a moment.')
                  return
                }
                window.open(data.signedUrl, '_blank', 'noopener,noreferrer')
              })
            }}
          >
            <span className="inline-flex items-center gap-2">
              {previewPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
              View latest upload
            </span>
          </Button>
        ) : null}

        {(() => {
          const rr = latest?.rejection_reason?.trim()
          const legacy = latest?.status === 'rejected' ? latest?.reviewer_note?.trim() : null
          const visible = rr || legacy
          if (!visible || (latest?.status !== 'rejected' && latest?.status !== 'resubmission_required')) return null
          return (
            <p className="rounded-lg border border-stroke bg-fill-glass px-3 py-2 text-xs text-muted">
              <span className="font-medium text-soft">{latest?.status === 'resubmission_required' ? 'Please update: ' : 'Note: '}</span>
              {visible}
            </p>
          )
        })()}
      </CardContent>
    </Card>
  )
}

export const KYC_TILES: KycTileConfig[] = [
  {
    id: 'license',
    label: 'Driving license',
    hint: 'Front (and back in one file if possible).',
    accept: KYC_ID_ACCEPT,
  },
  {
    id: 'aadhaar',
    label: 'Aadhaar',
    hint: 'Masked or partial number visible uploads only. PDF or clear photo.',
    accept: KYC_ID_ACCEPT,
  },
  {
    id: 'pan',
    label: 'PAN card',
    hint: 'Upload a clear photo or PDF of your PAN (alternative to Aadhaar for ID verification).',
    accept: KYC_ID_ACCEPT,
  },
  {
    id: 'selfie',
    label: 'Selfie verification',
    hint: 'Hold a neutral expression; face well lit, no filters. Image only.',
    accept: KYC_SELFIE_ACCEPT,
    selfie: true,
  },
  {
    id: 'passport',
    label: 'Passport',
    hint: 'Optional for Indian residents with Aadhaar or PAN + license. Required for some international IDs.',
    accept: KYC_ID_ACCEPT,
    required: false,
  },
]
