'use client'

import { useCallback, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { SupabaseClient } from '@supabase/supabase-js'
import { Check, Eye, FileUp, Loader2, ShieldCheck } from 'lucide-react'

import { registerKycDocumentAction } from '@/app/(main)/dashboard/actions'
import type { KycDocumentRow } from '@/lib/customer/kyc-queries'
import { SAFE_USER_MESSAGE } from '@/lib/errors/safe-user-message'
import type { Database } from '@/lib/supabase/database.types'
import type { KycDocumentTypeId } from '@/lib/kyc/constants'
import { KYC_ID_ACCEPT, KYC_MAX_FILE_BYTES, KYC_SELFIE_ACCEPT } from '@/lib/kyc/constants'
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
  if (acceptSelfie) {
    if (!file.type.startsWith('image/')) return 'Selfie must be an image (JPEG, PNG, or WebP).'
    return null
  }
  const okImage = file.type.startsWith('image/')
  const okPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
  if (!okImage && !okPdf) return 'Please upload a PDF or an image (JPEG, PNG, WebP).'
  return null
}

export function KycUploadTile({
  tile,
  userId,
  projectUrl,
  anonKey,
  supabase,
  latest,
  onRegistered,
}: {
  tile: KycTileConfig
  userId: string
  projectUrl: string
  anonKey: string
  supabase: SupabaseClient<Database>
  latest: KycDocumentRow | undefined
  onRegistered: (doc: KycDocumentRow) => void
}) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [progress, setProgress] = useState<number | null>(null)
  const [localError, setLocalError] = useState<string | null>(null)
  const [successFlash, setSuccessFlash] = useState(false)
  const [pending, startTransition] = useTransition()
  const [previewPending, startPreview] = useTransition()

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
      startTransition(async () => {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (!session?.access_token) {
          setLocalError('Your session expired. Sign in again.')
          return
        }

        const ext =
          (file.name.split('.').pop() ?? 'bin').replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'bin'
        const objectPath = `${userId}/${tile.id}-${Date.now()}.${ext}`
        setProgress(0)
        try {
          await uploadKycObjectWithProgress({
            projectUrl,
            anonKey,
            accessToken: session.access_token,
            objectPath,
            file,
            onProgress: (r) => setProgress(r),
          })

          const res = await registerKycDocumentAction({
            documentType: tile.id,
            storagePath: objectPath,
            byteSize: file.size,
            contentType: file.type || null,
            originalFilename: sanitizeFilename(file.name),
          })

          if (!res.ok) {
            await supabase.storage.from('kyc').remove([objectPath]).catch(() => {})
            setLocalError(res.message ?? 'Could not save document metadata.')
            setProgress(null)
            return
          }

          if (res.document) {
            onRegistered(res.document)
          }
          setProgress(null)
          setSuccessFlash(true)
          window.setTimeout(() => setSuccessFlash(false), 3200)
          router.refresh()
        } catch (e) {
          setProgress(null)
          console.error('[KycUploadTile] upload or register failed', e)
          setLocalError(SAFE_USER_MESSAGE.save)
        }
      })
    },
    [anonKey, onRegistered, projectUrl, router, supabase, tile.id, tile.selfie, userId],
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
            <Badge variant={latest.status === 'approved' ? 'success' : latest.status === 'rejected' ? 'muted' : 'electric'}>
              {latest.status}
            </Badge>
          ) : (
            <Badge variant="muted">Required</Badge>
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
          )}
        </div>

        {localError ? (
          <p className="rounded-lg border border-red-400/25 bg-red-500/[0.08] px-3 py-2 text-xs text-red-100/95">
            {localError}
          </p>
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
                  setLocalError(error?.message ?? 'Could not open a secure preview link.')
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

        {latest?.reviewer_note && latest.status === 'rejected' ? (
          <p className="rounded-lg border border-stroke bg-fill-glass px-3 py-2 text-xs text-muted">
            <span className="font-medium text-soft">Reviewer: </span>
            {latest.reviewer_note}
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}

export const KYC_TILES: KycTileConfig[] = [
  {
    id: 'aadhaar',
    label: 'Aadhaar',
    hint: 'Masked or partial number visible uploads only. PDF or clear photo.',
    accept: KYC_ID_ACCEPT,
  },
  {
    id: 'license',
    label: 'Driving license',
    hint: 'Front (and back in one file if possible).',
    accept: KYC_ID_ACCEPT,
  },
  {
    id: 'passport',
    label: 'Passport',
    hint: 'Bio-data page. PDF or image.',
    accept: KYC_ID_ACCEPT,
  },
  {
    id: 'selfie',
    label: 'Selfie verification',
    hint: 'Hold a neutral expression; face well lit, no filters. Image only.',
    accept: KYC_SELFIE_ACCEPT,
    selfie: true,
  },
]
