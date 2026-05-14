import { NextResponse } from 'next/server'
import JSZip from 'jszip'

import { parseBookingPdfDocKind } from '@/lib/pdf/booking-payload'
import { bookingPdfFilename } from '@/lib/pdf/booking-pdf-filename'
import { loadAdminBookingPdfPayload } from '@/lib/pdf/load-booking-payload-for-pdf'
import { renderBookingPdfBuffer } from '@/lib/pdf/render-booking-pdf'
import { getAuthSessionSummary } from '@/lib/auth/server'
import { roleAtLeast } from '@/lib/auth/roles'
import { isUuidString } from '@/lib/validation/uuid'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_IDS = 20

type Body = {
  ids?: unknown
  doc?: unknown
}

export async function POST(req: Request) {
  const session = await getAuthSessionSummary()
  if (!session || !roleAtLeast(session.appRole, 'ops_admin')) {
    return NextResponse.json({ ok: false, code: 'forbidden', message: 'Admin access required.' }, { status: 403 })
  }

  let json: Body
  try {
    json = (await req.json()) as Body
  } catch {
    return NextResponse.json({ ok: false, code: 'bad_request', message: 'Invalid JSON body.' }, { status: 400 })
  }

  const doc = parseBookingPdfDocKind(typeof json.doc === 'string' ? json.doc : null)
  if (!doc) {
    return NextResponse.json({ ok: false, code: 'bad_request', message: 'Invalid doc type.' }, { status: 400 })
  }

  const rawIds = Array.isArray(json.ids) ? json.ids : []
  const ids = rawIds
    .map((x) => (typeof x === 'string' ? x.trim() : ''))
    .filter((x) => x && isUuidString(x))
    .slice(0, MAX_IDS)

  if (!ids.length) {
    return NextResponse.json(
      { ok: false, code: 'bad_request', message: `Provide ids: string[] (UUID), max ${MAX_IDS}.` },
      { status: 400 },
    )
  }

  try {
    const zip = new JSZip()
    for (const id of ids) {
      const payload = await loadAdminBookingPdfPayload(id, doc)
      if (!payload) continue
      const buf = await renderBookingPdfBuffer(payload)
      zip.file(bookingPdfFilename(id, doc), buf)
    }
    if (Object.keys(zip.files).length === 0) {
      return NextResponse.json({ ok: false, code: 'not_found', message: 'No matching bookings for export.' }, { status: 404 })
    }
    const out = await zip.generateAsync({ type: 'nodebuffer' })
    return new NextResponse(new Uint8Array(out), {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="oxour-go-bookings-${doc}-export.zip"`,
        'Cache-Control': 'private, no-store',
      },
    })
  } catch (e) {
    console.error('[api/admin/bookings/pdf-bulk]', e)
    return NextResponse.json(
      { ok: false, code: 'export_failed', message: 'Bulk export failed. Try fewer bookings or retry.' },
      { status: 500 },
    )
  }
}
