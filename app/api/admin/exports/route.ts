import { NextResponse } from 'next/server'

import { fetchExportDataset, type ExportKind } from '@/lib/admin/data/exports'
import { logBackupOperation } from '@/lib/admin/data/backup-health'
import { exportFilename, rowsToCsv, rowsToExcelHtml } from '@/lib/admin/export/spreadsheet'
import { getAuthSessionSummary } from '@/lib/auth/server'
import { hasPermission } from '@/lib/auth/permissions'

const EXPORT_KINDS: ExportKind[] = ['bookings', 'payments', 'pending-dues', 'fleet', 'penalties', 'kyc-summary']

function parseKind(raw: string | null): ExportKind | null {
  if (!raw) return null
  return EXPORT_KINDS.includes(raw as ExportKind) ? (raw as ExportKind) : null
}

export async function GET(request: Request) {
  try {
    const summary = await getAuthSessionSummary()
    if (!summary || !hasPermission(summary.appRole, 'admin.exports.read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const url = new URL(request.url)
    const kind = parseKind(url.searchParams.get('type'))
    const format = url.searchParams.get('format') === 'xlsx' ? 'xlsx' : 'csv'
    const from = url.searchParams.get('from')?.trim() || undefined
    const to = url.searchParams.get('to')?.trim() || undefined

    if (!kind) {
      return NextResponse.json({ error: 'Invalid export type.' }, { status: 400 })
    }

    const permissionForKind: Record<ExportKind, boolean> = {
      bookings: hasPermission(summary.appRole, 'bookings.read'),
      payments: hasPermission(summary.appRole, 'payments.read'),
      'pending-dues': hasPermission(summary.appRole, 'payments.read'),
      fleet: hasPermission(summary.appRole, 'fleet.read'),
      penalties: hasPermission(summary.appRole, 'penalties.read'),
      'kyc-summary': hasPermission(summary.appRole, 'kyc.read'),
    }

    if (!permissionForKind[kind]) {
      return NextResponse.json({ error: 'Forbidden for this export type.' }, { status: 403 })
    }

    const { columns, rows, sheetName } = await fetchExportDataset(kind, { from, to })

    const filename = exportFilename(kind, format, from, to)

    await logBackupOperation({
      operationType: 'data_export',
      summary: `${kind} (${format}) — ${rows.length} rows`,
      performedBy: summary.user.id,
      metadata: { kind, format, from, to, rowCount: rows.length },
    })

    if (format === 'xlsx') {
      const body = rowsToExcelHtml(sheetName, columns, rows)
      return new NextResponse(body, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.ms-excel; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'no-store',
        },
      })
    }

    const body = rowsToCsv(columns, rows)
    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Export failed. Please try again.' }, { status: 500 })
  }
}
