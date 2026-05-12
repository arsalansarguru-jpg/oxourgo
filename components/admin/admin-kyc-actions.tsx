'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

import { adminGetKycSignedUrlAction, adminSetKycDocumentStatusAction } from '@/lib/admin/actions/kyc-actions'
import type { KycQueueRow } from '@/lib/admin/data/kyc'
import { AdminStatusPill } from '@/components/admin/admin-status-pill'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export function AdminKycActions({ row }: { row: KycQueueRow }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [msg, setMsg] = useState<string | null>(null)

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      <AdminStatusPill value={row.status} />
      <span className="text-xs text-muted">{row.document_type}</span>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={pending}
        onClick={() => {
          start(async () => {
            const r = await adminGetKycSignedUrlAction(row.id)
            if (!r.ok) {
              setMsg(r.message)
              return
            }
            window.open(r.url, '_blank', 'noopener,noreferrer')
          })
        }}
      >
        View file
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
              documentId: row.id,
              status: 'reviewing',
              reviewer_note: null,
            })
            if (!r.ok) setMsg(r.message)
            router.refresh()
          })
        }}
      >
        Mark reviewing
      </Button>
      <form
        className="flex flex-wrap items-end gap-2"
        action={(fd) => {
          setMsg(null)
          start(async () => {
            const r = await adminSetKycDocumentStatusAction({
              documentId: row.id,
              status: 'approved',
              reviewer_note: String(fd.get('note') ?? '') || null,
            })
            if (!r.ok) setMsg(r.message)
            router.refresh()
          })
        }}
      >
        <Input name="note" placeholder="Note (optional)" className="min-h-10 max-w-xs" />
        <Button type="submit" size="sm" disabled={pending}>
          Approve
        </Button>
      </form>
      <form
        className="flex flex-wrap items-end gap-2"
        action={(fd) => {
          setMsg(null)
          start(async () => {
            const r = await adminSetKycDocumentStatusAction({
              documentId: row.id,
              status: 'rejected',
              reviewer_note: String(fd.get('note') ?? '') || null,
            })
            if (!r.ok) setMsg(r.message)
            router.refresh()
          })
        }}
      >
        <Input name="note" placeholder="Rejection reason" className="min-h-10 max-w-xs" required />
        <Button type="submit" variant="danger" size="sm" disabled={pending}>
          Reject
        </Button>
      </form>
      {msg ? <p className="w-full text-xs text-red-300">{msg}</p> : null}
    </div>
  )
}
