'use client'

import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'

import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { cn } from '@/lib/utils/cn'

type AdminConfirmDialogProps = {
  open: boolean
  onClose: () => void
  title: string
  description: string
  confirmLabel?: string
  variant?: 'danger' | 'primary'
  requireReason?: boolean
  reasonLabel?: string
  pending?: boolean
  onConfirm: (reason: string) => void | Promise<void>
}

export function AdminConfirmDialog({
  open,
  onClose,
  title,
  description,
  confirmLabel = 'Confirm',
  variant = 'danger',
  requireReason = false,
  reasonLabel = 'Reason (required)',
  pending = false,
  onConfirm,
}: AdminConfirmDialogProps) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleConfirm = async () => {
    const trimmed = reason.trim()
    if (requireReason && !trimmed) {
      setError('Please provide a reason for this action.')
      return
    }
    setError(null)
    await onConfirm(trimmed)
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        if (!pending) onClose()
      }}
      title={title}
      className="max-w-md"
    >
      <div
        className={cn(
          'flex gap-3 rounded-xl border px-4 py-3 text-sm leading-relaxed',
          variant === 'danger'
            ? 'border-red-400/25 bg-red-500/[0.06] text-red-100/90'
            : 'border-electric/25 bg-electric/[0.06] text-soft',
        )}
      >
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 opacity-80" />
        <p>{description}</p>
      </div>
      {requireReason ? (
        <div className="mt-4 space-y-2">
          <Input
            label={reasonLabel}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Document why this override is necessary"
            disabled={pending}
          />
          {error ? <p className="text-xs text-red-300">{error}</p> : null}
        </div>
      ) : null}
      <div className="mt-6 flex flex-wrap justify-end gap-2">
        <Button type="button" variant="ghost" disabled={pending} onClick={onClose}>
          Cancel
        </Button>
        <Button
          type="button"
          variant={variant === 'danger' ? 'danger' : 'primary'}
          disabled={pending}
          onClick={() => void handleConfirm()}
        >
          {pending ? 'Working…' : confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}
