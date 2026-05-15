'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Activity,
  Archive,
  Database,
  Download,
  FileSpreadsheet,
  HardDrive,
  RotateCcw,
  Shield,
} from 'lucide-react'

import { AdminArchiveBadge } from '@/components/admin/admin-archive-badge'
import { AdminCard, AdminCardContent } from '@/components/admin/admin-card'
import { adminRestoreVehicleAction } from '@/lib/admin/actions/recovery-actions'
import type { BackupHealthBundle } from '@/lib/admin/data/backup-health'
import type { ExportKind } from '@/lib/admin/data/exports'
import { cn } from '@/lib/utils/cn'

const ease = [0.22, 1, 0.36, 1] as const

const EXPORT_OPTIONS: { kind: ExportKind; label: string; permission: string }[] = [
  { kind: 'bookings', label: 'Bookings', permission: 'bookings' },
  { kind: 'payments', label: 'Payments', permission: 'payments' },
  { kind: 'pending-dues', label: 'Pending dues', permission: 'payments' },
  { kind: 'fleet', label: 'Fleet report', permission: 'fleet' },
  { kind: 'penalties', label: 'Penalties', permission: 'penalties' },
  { kind: 'kyc-summary', label: 'KYC summary', permission: 'kyc' },
]

const STATUS_STYLE = {
  healthy: 'border-emerald-400/25 bg-emerald-500/10 text-emerald-200',
  warn: 'border-amber-400/25 bg-amber-500/10 text-amber-200',
  critical: 'border-rose-400/25 bg-rose-500/10 text-rose-200',
  unknown: 'border-white/[0.08] bg-white/[0.04] text-muted',
} as const

type Props = {
  health: BackupHealthBundle
  archivedVehicles: { id: string; name: string; brand: string; archivedAt: string | null }[]
  canExport: boolean
  canRestore: boolean
  exportPermissions: Record<string, boolean>
}

export function AdminBackupDashboard({
  health,
  archivedVehicles,
  canExport,
  canRestore,
  exportPermissions,
}: Props) {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [exportError, setExportError] = useState<string | null>(null)
  const [restoreMsg, setRestoreMsg] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function downloadUrl(kind: ExportKind, format: 'csv' | 'xlsx') {
    const params = new URLSearchParams({ type: kind, format })
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    return `/api/admin/exports?${params.toString()}`
  }

  return (
    <motion.div
      className="space-y-8 lg:space-y-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease }}
    >
      <AdminCard>
        <AdminCardContent className="flex flex-wrap items-start justify-between gap-4 p-6 sm:p-8">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-electric/90">Resilience</p>
            <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-soft sm:text-2xl">Database health</h2>
            <p className="mt-2 max-w-xl text-sm text-muted">
              Last checked {new Date(health.checkedAt).toLocaleString('en-IN')} · snapshots and audit trail support
              recovery workflows.
            </p>
          </div>
          <HardDrive className="h-8 w-8 text-electric/70" aria-hidden />
        </AdminCardContent>
      </AdminCard>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {health.indicators.map((ind) => (
          <AdminCard key={ind.id} className={cn('border', STATUS_STYLE[ind.status])}>
            <AdminCardContent className="p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] opacity-80">{ind.label}</p>
              <p className="mt-2 text-2xl font-semibold tabular-nums tracking-[-0.04em]">{ind.value}</p>
              {ind.detail ? <p className="mt-1 text-[11px] opacity-75">{ind.detail}</p> : null}
            </AdminCardContent>
          </AdminCard>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <AdminCard>
          <AdminCardContent className="space-y-5 p-6 sm:p-8">
            <div className="flex items-start gap-3">
              <Download className="h-5 w-5 text-electric" aria-hidden />
              <div>
                <h2 className="text-lg font-semibold text-soft">Data exports</h2>
                <p className="mt-1 text-sm text-muted">CSV or Excel-compatible · filtered by created date (UTC).</p>
              </div>
            </div>

            {canExport ? (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-xs text-muted">
                    From
                    <input
                      type="date"
                      value={from}
                      onChange={(e) => setFrom(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-soft"
                    />
                  </label>
                  <label className="block text-xs text-muted">
                    To
                    <input
                      type="date"
                      value={to}
                      onChange={(e) => setTo(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-soft"
                    />
                  </label>
                </div>
                {exportError ? <p className="text-xs text-rose-300">{exportError}</p> : null}
                <ul className="space-y-2">
                  {EXPORT_OPTIONS.filter((o) => exportPermissions[o.permission]).map((opt) => (
                    <li
                      key={opt.kind}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3"
                    >
                      <span className="text-sm font-medium text-soft">{opt.label}</span>
                      <div className="flex gap-2">
                        <a
                          href={downloadUrl(opt.kind, 'csv')}
                          className="inline-flex items-center gap-1 rounded-lg border border-white/[0.08] bg-white/[0.05] px-2.5 py-1 text-[11px] font-semibold text-electric hover:bg-white/[0.08]"
                          onClick={() => setExportError(null)}
                        >
                          <FileSpreadsheet className="h-3.5 w-3.5" /> CSV
                        </a>
                        <a
                          href={downloadUrl(opt.kind, 'xlsx')}
                          className="inline-flex items-center gap-1 rounded-lg border border-white/[0.08] bg-white/[0.05] px-2.5 py-1 text-[11px] font-semibold text-electric hover:bg-white/[0.08]"
                        >
                          <Download className="h-3.5 w-3.5" /> Excel
                        </a>
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="text-sm text-muted">Export access is restricted for your role.</p>
            )}
          </AdminCardContent>
        </AdminCard>

        <AdminCard>
          <AdminCardContent className="space-y-5 p-6 sm:p-8">
            <div className="flex items-start gap-3">
              <Archive className="h-5 w-5 text-amber-300" aria-hidden />
              <div>
                <h2 className="text-lg font-semibold text-soft">Archive recovery</h2>
                <p className="mt-1 text-sm text-muted">
                  {health.archivedCounts.vehicles} vehicles · {health.archivedCounts.violations} violations ·{' '}
                  {health.archivedCounts.kycDocuments} KYC docs archived.
                </p>
              </div>
            </div>

            {restoreMsg ? <p className="text-xs text-emerald-300">{restoreMsg}</p> : null}

            {archivedVehicles.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-white/[0.08] px-4 py-6 text-center text-sm text-muted">
                No archived vehicles pending restore.
              </p>
            ) : (
              <ul className="space-y-2">
                {archivedVehicles.map((v) => (
                  <li
                    key={v.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3"
                  >
                    <div>
                      <AdminArchiveBadge />
                      <p className="mt-1 text-sm font-medium text-soft">
                        {v.brand} {v.name}
                      </p>
                      {v.archivedAt ? (
                        <p className="text-[11px] text-muted">
                          Archived {new Date(v.archivedAt).toLocaleDateString('en-IN')}
                        </p>
                      ) : null}
                    </div>
                    {canRestore ? (
                      <button
                        type="button"
                        disabled={pending}
                        className="inline-flex items-center gap-1 rounded-lg border border-electric/30 bg-electric/10 px-2.5 py-1 text-[11px] font-semibold text-electric disabled:opacity-50"
                        onClick={() => {
                          setRestoreMsg(null)
                          startTransition(async () => {
                            const r = await adminRestoreVehicleAction(v.id)
                            setRestoreMsg(r.ok ? 'Vehicle restored.' : r.message ?? 'Restore failed.')
                          })
                        }}
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Restore
                      </button>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}

            <Link
              href="/admin/audit"
              className="inline-flex items-center gap-1 text-[12px] font-semibold text-electric hover:text-electric/85"
            >
              <Activity className="h-3.5 w-3.5" /> View audit trail
            </Link>
          </AdminCardContent>
        </AdminCard>
      </div>

      <AdminCard>
        <AdminCardContent className="space-y-4 p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <Database className="h-5 w-5 text-electric" aria-hidden />
            <h2 className="text-lg font-semibold text-soft">Recent backup operations</h2>
          </div>
          {health.recentOperations.length === 0 ? (
            <p className="text-sm text-muted">No export or recovery operations logged yet.</p>
          ) : (
            <ul className="divide-y divide-white/[0.06]">
              {health.recentOperations.map((op) => (
                <li key={op.id} className="flex flex-wrap justify-between gap-2 py-3 text-sm">
                  <span className="font-medium text-soft">{op.operationType}</span>
                  <span className="text-muted">{op.summary ?? op.status}</span>
                  <span className="w-full text-[11px] text-muted sm:w-auto">
                    {new Date(op.createdAt).toLocaleString('en-IN')}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </AdminCardContent>
      </AdminCard>

      <AdminCard className="border-electric/20 bg-electric/[0.04]">
        <AdminCardContent className="flex gap-4 p-6 sm:p-8">
          <Shield className="h-6 w-6 shrink-0 text-electric" aria-hidden />
          <div>
            <p className="text-sm font-medium text-soft">Operational runbook</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              See <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs">docs/BACKUP_AND_RECOVERY.md</code>{' '}
              for Supabase backup schedules, PITR, storage retention, and incident response steps.
            </p>
          </div>
        </AdminCardContent>
      </AdminCard>
    </motion.div>
  )
}
