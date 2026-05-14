import { NextResponse } from 'next/server'

import { runTripReminderJob } from '@/lib/notifications/jobs/trip-reminders'

/**
 * Secured cron hook for trip reminders (24h window configurable in job).
 * Set CRON_SECRET and call with: Authorization: Bearer <CRON_SECRET>
 * Wire from Supabase Scheduled Triggers, Vercel Cron, or similar.
 */
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET?.trim()
  const auth = request.headers.get('authorization')
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  try {
    const result = await runTripReminderJob()
    return NextResponse.json({ ok: true, ...result })
  } catch (e) {
    console.error('[api/cron/trip-reminders]', e)
    return NextResponse.json({ ok: false, error: 'job_failed' }, { status: 500 })
  }
}
