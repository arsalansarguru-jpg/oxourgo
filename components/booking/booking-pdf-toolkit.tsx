'use client'

import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { Download, Eye, Loader2, Printer, RefreshCw } from 'lucide-react'

import type { BookingPdfDocKind } from '@/lib/pdf/booking-payload'
import { bookingPdfFilename } from '@/lib/pdf/booking-pdf-filename'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/Button'

const DOCS: { id: BookingPdfDocKind; label: string; hint: string }[] = [
  { id: 'confirmation', label: 'Confirmation', hint: 'Reservation record' },
  { id: 'invoice', label: 'Invoice', hint: 'Charges & GST' },
  { id: 'summary', label: 'Trip summary', hint: 'Trip at a glance' },
]

function pdfUrl(bookingId: string, doc: BookingPdfDocKind) {
  return `/api/bookings/${bookingId}/pdf?doc=${doc}`
}

export function BookingPdfToolkit({ bookingId, className }: { bookingId: string; className?: string }) {
  const [previewDoc, setPreviewDoc] = useState<BookingPdfDocKind | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()
  const [downloading, setDownloading] = useState<BookingPdfDocKind | null>(null)
  const revokeRef = useRef<string | null>(null)
  const iframeRef = useRef<HTMLIFrameElement | null>(null)

  const cleanup = useCallback(() => {
    if (revokeRef.current) {
      URL.revokeObjectURL(revokeRef.current)
      revokeRef.current = null
    }
  }, [])

  useEffect(() => () => cleanup(), [cleanup])

  const loadPreview = useCallback(
    (doc: BookingPdfDocKind) => {
      setError(null)
      start(async () => {
        cleanup()
        setPreviewUrl(null)
        setPreviewDoc(doc)
        try {
          const res = await fetch(pdfUrl(bookingId, doc), { credentials: 'same-origin' })
          if (!res.ok) {
            const j = (await res.json().catch(() => null)) as { message?: string } | null
            setPreviewUrl(null)
            setError(j?.message ?? 'Could not load PDF preview.')
            return
          }
          const blob = await res.blob()
          const url = URL.createObjectURL(blob)
          revokeRef.current = url
          setPreviewUrl(url)
        } catch {
          setPreviewUrl(null)
          setError('Network error while loading PDF.')
        }
      })
    },
    [bookingId, cleanup],
  )

  const download = useCallback(
    (doc: BookingPdfDocKind) => {
      setError(null)
      setDownloading(doc)
      void (async () => {
        try {
          const res = await fetch(pdfUrl(bookingId, doc), { credentials: 'same-origin' })
          if (!res.ok) {
            const j = (await res.json().catch(() => null)) as { message?: string } | null
            setError(j?.message ?? 'Download failed.')
            return
          }
          const blob = await res.blob()
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = bookingPdfFilename(bookingId, doc)
          a.rel = 'noopener'
          a.click()
          window.setTimeout(() => URL.revokeObjectURL(url), 4000)
        } catch {
          setError('Network error while downloading PDF.')
        } finally {
          setDownloading(null)
        }
      })()
    },
    [bookingId],
  )

  const printPreview = useCallback(() => {
    if (!previewUrl) return
    const win = iframeRef.current?.contentWindow
    if (win) {
      try {
        win.focus()
        win.print()
        return
      } catch {
        /* fall through */
      }
    }
    const w = window.open(previewUrl, '_blank', 'noopener,noreferrer')
    w?.addEventListener('load', () => {
      try {
        w.print()
      } catch {
        /* ignore */
      }
    })
  }, [previewUrl])

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        {DOCS.map((d) => (
          <div
            key={d.id}
            className="flex min-w-0 flex-1 flex-col gap-2 rounded-2xl border border-stroke bg-matte/[0.35] p-4 sm:min-w-[200px]"
          >
            <div>
              <p className="text-sm font-semibold text-soft">{d.label}</p>
              <p className="text-xs text-muted">{d.hint}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="gap-1.5"
                disabled={pending}
                onClick={() => loadPreview(d.id)}
              >
                {pending && previewDoc === d.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                ) : (
                  <Eye className="h-3.5 w-3.5" aria-hidden />
                )}
                Preview
              </Button>
              <Button
                type="button"
                size="sm"
                className="gap-1.5"
                disabled={pending || downloading === d.id}
                onClick={() => download(d.id)}
              >
                {downloading === d.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                ) : (
                  <Download className="h-3.5 w-3.5" aria-hidden />
                )}
                Download
              </Button>
            </div>
          </div>
        ))}
      </div>

      {error ? (
        <div className="flex flex-col gap-2 rounded-xl border border-red-400/25 bg-red-500/[0.08] px-4 py-3 text-sm text-red-100/95 sm:flex-row sm:items-center sm:justify-between">
          <span>{error}</span>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="shrink-0 gap-1.5"
            onClick={() => (previewDoc ? loadPreview(previewDoc) : setError(null))}
            disabled={!previewDoc}
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden />
            Retry
          </Button>
        </div>
      ) : null}

      {previewUrl ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-matte/85 p-4 backdrop-blur-md">
          <div className="relative flex h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-stroke bg-matte shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-stroke px-6 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-electric">
                  Preview ·{' '}
                  {previewDoc === 'confirmation' ? 'Confirmation' : previewDoc === 'invoice' ? 'Invoice' : 'Trip summary'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button type="button" size="sm" variant="ghost" className="gap-1.5 hover:text-soft" onClick={printPreview}>
                  <Printer className="h-3.5 w-3.5" aria-hidden />
                  Print
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    cleanup()
                    setPreviewUrl(null)
                    setPreviewDoc(null)
                  }}
                >
                  Close
                </Button>
              </div>
            </div>
            {/* Iframe container */}
            <div className="flex-1 bg-white">
              <iframe
                ref={iframeRef}
                title="PDF preview"
                src={previewUrl}
                className="h-full w-full border-0"
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
