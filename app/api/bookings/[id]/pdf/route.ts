import { NextResponse } from 'next/server'

import { captureRouteException } from '@/lib/monitoring/capture-route-exception'
import { oxourWrapRouteHandler } from '@/lib/monitoring/oxour-wrap-route-handler'
import { parseBookingPdfDocKind } from '@/lib/pdf/booking-payload'
import { bookingPdfFilename } from '@/lib/pdf/booking-pdf-filename'
import { loadCustomerBookingPdfPayload } from '@/lib/pdf/load-booking-payload-for-pdf'
import { renderBookingPdfBuffer } from '@/lib/pdf/render-booking-pdf'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function customerBookingPdfGET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const url = new URL(req.url)
  const doc = parseBookingPdfDocKind(url.searchParams.get('doc'))
  if (!doc) {
    return NextResponse.json({ ok: false, code: 'bad_request', message: 'Missing or invalid doc type.' }, { status: 400 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ ok: false, code: 'unauthorized', message: 'Sign in required.' }, { status: 401 })
  }

  try {
    const payload = await loadCustomerBookingPdfPayload(id, user.id, doc)
    if (!payload) {
      return NextResponse.json({ ok: false, code: 'not_found', message: 'Booking not found.' }, { status: 404 })
    }
    const buffer = await renderBookingPdfBuffer(payload)
    const filename = bookingPdfFilename(id, doc)
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
        'Cache-Control': 'private, no-store',
      },
    })
  } catch (e) {
    console.error('[api/bookings/pdf]', e)
    captureRouteException('booking', 'GET /api/bookings/[id]/pdf', e)
    return NextResponse.json(
      { ok: false, code: 'pdf_failed', message: 'Unable to generate PDF. Please try again.' },
      { status: 500 },
    )
  }
}

export const GET = oxourWrapRouteHandler(
  { method: 'GET', parameterizedRoute: '/api/bookings/[id]/pdf' },
  'booking',
  customerBookingPdfGET,
)
