import { NextResponse } from 'next/server'

import { captureRouteException } from '@/lib/monitoring/capture-route-exception'
import { oxourWrapRouteHandler } from '@/lib/monitoring/oxour-wrap-route-handler'
import { parseBookingPdfDocKind } from '@/lib/pdf/booking-payload'
import { bookingPdfFilename } from '@/lib/pdf/booking-pdf-filename'
import { loadAdminBookingPdfPayload } from '@/lib/pdf/load-booking-payload-for-pdf'
import { renderBookingPdfBuffer } from '@/lib/pdf/render-booking-pdf'
import { getAuthSessionSummary } from '@/lib/auth/server'
import { roleAtLeast } from '@/lib/auth/roles'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function adminBookingPdfGET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAuthSessionSummary()
  if (!session || !roleAtLeast(session.appRole, 'ops_admin')) {
    return NextResponse.json({ ok: false, code: 'forbidden', message: 'Admin access required.' }, { status: 403 })
  }

  const { id } = await params
  const url = new URL(req.url)
  const doc = parseBookingPdfDocKind(url.searchParams.get('doc'))
  if (!doc) {
    return NextResponse.json({ ok: false, code: 'bad_request', message: 'Missing or invalid doc type.' }, { status: 400 })
  }

  try {
    const payload = await loadAdminBookingPdfPayload(id, doc)
    if (!payload) {
      return NextResponse.json({ ok: false, code: 'not_found', message: 'Booking not found.' }, { status: 404 })
    }
    const buffer = await renderBookingPdfBuffer(payload)
    const filename = bookingPdfFilename(id, doc)
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'private, no-store',
      },
    })
  } catch (e) {
    console.error('[api/admin/bookings/pdf]', e)
    captureRouteException('admin', 'GET /api/admin/bookings/[id]/pdf', e)
    return NextResponse.json(
      { ok: false, code: 'pdf_failed', message: 'Unable to generate PDF. Please try again.' },
      { status: 500 },
    )
  }
}

export const GET = oxourWrapRouteHandler(
  { method: 'GET', parameterizedRoute: '/api/admin/bookings/[id]/pdf' },
  'admin',
  adminBookingPdfGET,
)
