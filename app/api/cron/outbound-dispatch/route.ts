import { NextResponse } from 'next/server'

import { captureRouteException } from '@/lib/monitoring/capture-route-exception'
import { oxourWrapRouteHandler } from '@/lib/monitoring/oxour-wrap-route-handler'
import { runOutboundDispatchJob } from '@/lib/notifications/jobs/outbound-dispatch'

/**
 * Secured cron: processes `outbound_jobs` (email). Authorization: Bearer <CRON_SECRET>
 */
async function outboundDispatchPOST(request: Request) {
  const secret = process.env.CRON_SECRET?.trim()
  const auth = request.headers.get('authorization')
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  try {
    const result = await runOutboundDispatchJob()
    return NextResponse.json({ ok: true, ...result })
  } catch (e) {
    console.error('[api/cron/outbound-dispatch]', e)
    captureRouteException('admin', 'POST /api/cron/outbound-dispatch', e)
    return NextResponse.json({ ok: false, error: 'job_failed' }, { status: 500 })
  }
}

export const POST = oxourWrapRouteHandler(
  { method: 'POST', parameterizedRoute: '/api/cron/outbound-dispatch' },
  'admin',
  outboundDispatchPOST,
)
