import { NextResponse } from 'next/server'

import { captureRouteException } from '@/lib/monitoring/capture-route-exception'
import { oxourWrapRouteHandler } from '@/lib/monitoring/oxour-wrap-route-handler'
import { runReturnReminderJob } from '@/lib/notifications/jobs/return-reminders'

/** Secured cron: return reminders. Authorization: Bearer <CRON_SECRET> */
async function returnRemindersPOST(request: Request) {
  const secret = process.env.CRON_SECRET?.trim()
  const auth = request.headers.get('authorization')
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  try {
    const result = await runReturnReminderJob()
    return NextResponse.json({ ok: true, ...result })
  } catch (e) {
    console.error('[api/cron/return-reminders]', e)
    captureRouteException('admin', 'POST /api/cron/return-reminders', e)
    return NextResponse.json({ ok: false, error: 'job_failed' }, { status: 500 })
  }
}

export const POST = oxourWrapRouteHandler(
  { method: 'POST', parameterizedRoute: '/api/cron/return-reminders' },
  'admin',
  returnRemindersPOST,
)
