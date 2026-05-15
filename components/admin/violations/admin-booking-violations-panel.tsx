'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useRef, useState, useTransition } from 'react'
import { FileUp, Gavel, History, Plus } from 'lucide-react'

import { AdminCard, AdminCardContent } from '@/components/admin/admin-card'
import { AdminStatusPill } from '@/components/admin/admin-status-pill'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import {
  adminCreateViolationAction,
  adminDeductViolationFromDepositAction,
  adminDeleteViolationAction,
  adminMarkViolationDisputedAction,
  adminNotifyViolationCustomerAction,
  adminRecordViolationManualPaymentAction,
  adminResolveViolationAction,
  adminUploadViolationChallanAction,
} from '@/lib/admin/actions/violation-actions'
import type { AdminBookingViolationsBundle } from '@/lib/admin/data/violations'
import {
  VIOLATION_TYPES,
  VIOLATION_TYPE_LABELS,
  violationTypeLabel,
  type ViolationRow,
} from '@/lib/booking/violations'
import { formatInr } from '@/lib/format'
import { cn } from '@/lib/utils/cn'

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

function ViolationTimeline({
  events,
  violationId,
}: {
  events: AdminBookingViolationsBundle['events']
  violationId: string
}) {
  const rows = events.filter((e) => e.violation_id === violationId).slice(0, 8)
  if (rows.length === 0) return null
  return (
    <ul className="mt-3 space-y-2 border-t border-white/[0.06] pt-3">
      {rows.map((e) => (
        <li key={e.id} className="flex gap-2 text-xs text-muted">
          <History className="mt-0.5 h-3.5 w-3.5 shrink-0 text-electric/70" aria-hidden />
          <span>
            <span className="font-medium text-soft">{e.event_type.replace(/_/g, ' ')}</span>
            <span className="text-muted"> · {fmtDate(e.created_at)}</span>
          </span>
        </li>
      ))}
    </ul>
  )
}

function ViolationCard({
  violation,
  challanUrl,
  events,
  bookingId,
  onMessage,
}: {
  violation: ViolationRow
  challanUrl?: string
  events: AdminBookingViolationsBundle['events']
  bookingId: string
  onMessage: (msg: string | null) => void
}) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)
  const settled = violation.status === 'paid' || violation.status === 'deducted_from_deposit'

  const run = (fn: () => Promise<{ ok: boolean; message?: string }>) => {
    onMessage(null)
    start(async () => {
      const r = await fn()
      if (!r.ok) onMessage(r.message ?? 'Request failed')
      router.refresh()
    })
  }

  return (
    <article className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-soft">{violationTypeLabel(violation.violation_type)}</p>
          <p className="mt-0.5 text-xs text-muted">{violation.reason}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <AdminStatusPill value={violation.status} />
          <p className="text-lg font-semibold tabular-nums text-soft">{formatInr(violation.amount_rupees)}</p>
        </div>
      </div>

      <dl className="mt-4 grid gap-2 text-xs sm:grid-cols-2">
        <div>
          <dt className="text-muted">Violation date</dt>
          <dd className="text-soft">{violation.violation_date}</dd>
        </div>
        <div>
          <dt className="text-muted">Authority</dt>
          <dd className="text-soft">{violation.authority_source?.trim() || '—'}</dd>
        </div>
        {violation.notes ? (
          <div className="sm:col-span-2">
            <dt className="text-muted">Notes</dt>
            <dd className="text-soft">{violation.notes}</dd>
          </div>
        ) : null}
        {violation.status === 'paid' ? (
          <div>
            <dt className="text-muted">Paid</dt>
            <dd className="tabular-nums text-emerald-200">{formatInr(violation.amount_paid_rupees)}</dd>
          </div>
        ) : null}
        {violation.status === 'deducted_from_deposit' ? (
          <div>
            <dt className="text-muted">From deposit</dt>
            <dd className="tabular-nums text-amber-100">{formatInr(violation.amount_deducted_rupees)}</dd>
          </div>
        ) : null}
      </dl>

      {challanUrl ? (
        <p className="mt-3">
          <a
            href={challanUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-electric underline-offset-4 hover:underline"
          >
            View challan copy →
          </a>
        </p>
      ) : null}

      {!settled ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (!file) return
              const fd = new FormData()
              fd.set('violationId', violation.id)
              fd.set('file', file)
              run(() => adminUploadViolationChallanAction(fd))
              e.target.value = ''
            }}
          />
          <Button type="button" size="sm" variant="secondary" disabled={pending} onClick={() => fileRef.current?.click()}>
            <FileUp className="mr-1.5 h-3.5 w-3.5" />
            Upload challan
          </Button>
          {violation.status === 'pending' ? (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={pending}
              onClick={() => run(() => adminNotifyViolationCustomerAction(violation.id))}
            >
              Notify customer
            </Button>
          ) : null}
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={pending}
            onClick={() => run(() => adminDeductViolationFromDepositAction(violation.id))}
          >
            Deduct deposit
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={pending}
            onClick={() => run(() => adminRecordViolationManualPaymentAction({ violationId: violation.id }))}
          >
            Payment received
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={pending}
            onClick={() => run(() => adminMarkViolationDisputedAction({ violationId: violation.id }))}
          >
            Dispute
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={pending}
            onClick={() => run(() => adminResolveViolationAction({ violationId: violation.id, resolution: 'waived' }))}
          >
            Waive
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="text-red-200/90"
            disabled={pending}
            onClick={() => {
              if (!confirm('Delete this violation record?')) return
              run(() => adminDeleteViolationAction(violation.id))
            }}
          >
            Delete
          </Button>
        </div>
      ) : null}

      <ViolationTimeline events={events} violationId={violation.id} />
      <p className="mt-2 font-mono text-[10px] text-muted">
        {violation.id.slice(0, 8)}… · booking {bookingId.slice(0, 8)}…
      </p>
    </article>
  )
}

export function AdminBookingViolationsPanel({
  bookingId,
  bundle,
}: {
  bookingId: string
  bundle: AdminBookingViolationsBundle
}) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [msg, setMsg] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  const run = (fn: () => Promise<{ ok: boolean; message?: string }>) => {
    setMsg(null)
    start(async () => {
      const r = await fn()
      if (!r.ok) setMsg(r.message ?? 'Request failed')
      else setShowForm(false)
      router.refresh()
    })
  }

  return (
    <AdminCard className="border border-white/[0.06] bg-gradient-to-br from-rose-500/[0.04] via-transparent to-transparent">
      <AdminCardContent className="space-y-5 p-5 sm:p-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-3">
            <Gavel className="mt-0.5 h-5 w-5 shrink-0 text-rose-300/80" aria-hidden />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Compliance</p>
              <h2 className="text-lg font-semibold text-soft">Fines &amp; violations</h2>
              <p className="mt-1 text-xs text-muted">
                Record challans, tolls, parking, towing, and damage liabilities — synced to deposit traffic-fine totals.
              </p>
            </div>
          </div>
          <Link href="/admin/violations" className="text-xs font-semibold text-electric underline-offset-4 hover:underline">
            All violations →
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Metric label="Outstanding" value={formatInr(bundle.summary.outstandingRupees)} accent="amber" />
          <Metric label="Collected" value={formatInr(bundle.summary.collectedRupees)} accent="emerald" />
          <Metric label="Total liability" value={formatInr(bundle.summary.totalLiabilityRupees)} />
        </div>

        {msg ? (
          <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-100" role="alert">
            {msg}
          </p>
        ) : null}

        <Button type="button" size="sm" variant="secondary" disabled={pending} onClick={() => setShowForm((v) => !v)}>
          <Plus className="mr-1.5 h-4 w-4" />
          {showForm ? 'Cancel' : 'Add violation'}
        </Button>

        {showForm ? (
          <form
            className="space-y-4 rounded-2xl border border-white/[0.08] bg-black/20 p-4"
            onSubmit={(e) => {
              e.preventDefault()
              const fd = new FormData(e.currentTarget)
              run(() =>
                adminCreateViolationAction({
                  bookingId,
                  violationType: String(fd.get('violationType')),
                  amountRupees: Number(fd.get('amountRupees')),
                  reason: String(fd.get('reason')),
                  violationDate: String(fd.get('violationDate')),
                  authoritySource: String(fd.get('authoritySource') || ''),
                  notes: String(fd.get('notes') || ''),
                  notifyCustomer: fd.get('notifyCustomer') === 'on',
                }),
              )
            }}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-xs font-medium text-muted">
                Type
                <select
                  name="violationType"
                  required
                  className="mt-1 w-full rounded-lg border border-stroke-strong bg-matte/[0.55] px-3 py-2 text-sm text-soft"
                  defaultValue="traffic_challan"
                >
                  {VIOLATION_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {VIOLATION_TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
              </label>
              <Input name="amountRupees" type="number" min={1} required label="Amount (₹)" />
              <Input name="violationDate" type="date" required label="Violation date" />
              <Input name="authoritySource" label="Authority / source" placeholder="RTO, NHAI, mall parking…" />
            </div>
            <Input name="reason" required label="Reason" placeholder="e.g. Speed camera — ORR" />
            <label className="block text-xs font-medium text-muted">
              Internal notes
              <textarea
                name="notes"
                rows={2}
                className="mt-1 w-full rounded-lg border border-stroke-strong bg-matte/[0.55] px-3 py-2 text-sm text-soft"
              />
            </label>
            <label className="flex items-center gap-2 text-xs text-muted">
              <input type="checkbox" name="notifyCustomer" className="rounded border-stroke-strong" />
              Notify customer immediately
            </label>
            <Button type="submit" size="sm" disabled={pending}>
              Save violation
            </Button>
          </form>
        ) : null}

        {bundle.violations.length === 0 ? (
          <p className="rounded-xl border border-dashed border-white/[0.1] px-4 py-8 text-center text-sm text-muted">
            No violations on this trip yet.
          </p>
        ) : (
          <div className="space-y-4">
            {bundle.violations.map((v) => (
              <ViolationCard
                key={v.id}
                violation={v}
                challanUrl={bundle.challanSignedUrls[v.id]}
                events={bundle.events}
                bookingId={bookingId}
                onMessage={setMsg}
              />
            ))}
          </div>
        )}
      </AdminCardContent>
    </AdminCard>
  )
}

function Metric({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent?: 'amber' | 'emerald'
}) {
  return (
    <div
      className={cn(
        'rounded-xl border border-white/[0.06] bg-white/[0.03] p-3',
        accent === 'amber' && 'border-amber-400/20 bg-amber-500/[0.06]',
        accent === 'emerald' && 'border-emerald-400/20 bg-emerald-500/[0.06]',
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums text-soft">{value}</p>
    </div>
  )
}
