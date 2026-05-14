'use client'

import { useState } from 'react'
import { Download, Loader2, RefreshCw } from 'lucide-react'

import type { BookingPdfDocKind } from '@/lib/pdf/booking-payload'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils/cn'

const DOC_OPTIONS: { value: BookingPdfDocKind; label: string }[] = [
  { value: 'invoice', label: 'Invoices' },
  { value: 'summary', label: 'Trip summaries' },
  { value: 'confirmation', label: 'Confirmations' },
]

type Props = {
  bookingIds: string[]
  className?: string
}

export function AdminBookingsBulkPdfBar({ bookingIds, className }: Props) {
  const [doc, setDoc] = useState<BookingPdfDocKind>('invoice')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const ids = bookingIds.slice(0, 20)
  const canExport = ids.length > 0

  async function runExport() {
    if (!canExport) return
    setError(null)
    setBusy(true)
    try {
      const res = await fetch('/api/admin/bookings/pdf-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ ids, doc }),
      })
      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as { message?: string } | null
        setError(j?.message ?? 'Export failed.')
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `oxour-go-bookings-${doc}-export.zip`
      a.rel = 'noopener'
      a.click()
      window.setTimeout(() => URL.revokeObjectURL(url), 6000)
    } catch {
      setError('Network error during export.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={cn('rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 theme-light:border-stroke-strong theme-light:bg-white/75', className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Bulk PDF (this page)</p>
          <p className="text-xs text-muted">
            Up to 20 UUIDs per request — currently <span className="font-semibold text-soft">{ids.length}</span> on this
            page.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="bulk-pdf-doc" className="sr-only">
            Document type
          </label>
          <select
            id="bulk-pdf-doc"
            value={doc}
            disabled={busy}
            onChange={(e) => setDoc(e.target.value as BookingPdfDocKind)}
            className={cn(
              'h-10 min-w-[10rem] rounded-xl border border-white/[0.1] bg-matte/[0.55] px-3 text-sm font-medium text-soft theme-light:border-stroke-strong theme-light:bg-white/90',
              'focus:border-electric/55 focus:outline-none focus:ring-2 focus:ring-electric/22',
            )}
          >
            {DOC_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <Button type="button" size="sm" className="gap-1.5" disabled={!canExport || busy} onClick={() => void runExport()}>
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <Download className="h-3.5 w-3.5" aria-hidden />}
            ZIP export
          </Button>
          {error ? (
            <Button type="button" size="sm" variant="secondary" className="gap-1.5" disabled={busy} onClick={() => void runExport()}>
              <RefreshCw className="h-3.5 w-3.5" aria-hidden />
              Retry
            </Button>
          ) : null}
        </div>
      </div>
      {error ? <p className="mt-2 text-xs font-medium text-red-200 theme-light:text-red-800">{error}</p> : null}
    </div>
  )
}
