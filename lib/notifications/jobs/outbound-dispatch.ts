import 'server-only'

import { Resend } from 'resend'

import { resolveOutboundEmail } from '@/lib/email/resolve-outbound-email'
import { isOutboundEmailTemplateKey } from '@/lib/email/template-keys'
import { getEmailFromAddress } from '@/lib/notifications/channels/outbound-enqueue'
import { captureRouteException } from '@/lib/monitoring/capture-route-exception'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Database } from '@/lib/supabase/database.types'

type OutboundJobRow = Database['public']['Tables']['outbound_jobs']['Row']

const MAX_SEND_ATTEMPTS = 8

function backoffMs(attemptAfterIncrement: number): number {
  const minutes = Math.min(45, Math.pow(2, Math.min(attemptAfterIncrement - 1, 6)))
  return minutes * 60 * 1000
}

async function resetStaleProcessing(admin: ReturnType<typeof createAdminClient>): Promise<number> {
  const staleBefore = new Date(Date.now() - 10 * 60 * 1000).toISOString()
  const { data, error } = await admin
    .from('outbound_jobs')
    .update({ status: 'pending', updated_at: new Date().toISOString() })
    .eq('status', 'processing')
    .lt('updated_at', staleBefore)
    .select('id')

  if (error) {
    console.error('[outbound-dispatch] resetStaleProcessing', error.message)
    return 0
  }
  return data?.length ?? 0
}

async function markSent(admin: ReturnType<typeof createAdminClient>, id: string) {
  await admin
    .from('outbound_jobs')
    .update({ status: 'sent', last_error: null, updated_at: new Date().toISOString() })
    .eq('id', id)
}

async function markDead(admin: ReturnType<typeof createAdminClient>, id: string, err: string, attempts: number) {
  await admin
    .from('outbound_jobs')
    .update({
      status: 'dead',
      last_error: err.slice(0, 500),
      attempts,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
}

async function markRetry(
  admin: ReturnType<typeof createAdminClient>,
  id: string,
  err: string,
  nextAttempts: number,
) {
  const nextRun = new Date(Date.now() + backoffMs(nextAttempts)).toISOString()
  await admin
    .from('outbound_jobs')
    .update({
      status: 'pending',
      last_error: err.slice(0, 500),
      attempts: nextAttempts,
      next_run_at: nextRun,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
}

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY?.trim()
  if (!key) return null
  return new Resend(key)
}

export async function runOutboundDispatchJob(batchSize = 25): Promise<{
  claimed: number
  sent: number
  failed: number
  dead: number
  stale_reset: number
}> {
  const admin = createAdminClient()
  const stale = await resetStaleProcessing(admin)

  const resend = getResend()
  if (!resend) {
    return { claimed: 0, sent: 0, failed: 0, dead: 0, stale_reset: stale }
  }

  const { data: jobs, error } = await admin.rpc('claim_outbound_jobs_batch', {
    p_batch_size: batchSize,
  })

  if (error) {
    console.error('[outbound-dispatch] claim rpc', error.message)
    captureRouteException('admin', 'runOutboundDispatchJob.claim', error)
    return { claimed: 0, sent: 0, failed: 0, dead: 0, stale_reset: stale }
  }

  const list = (jobs ?? []) as OutboundJobRow[]
  let sent = 0
  let failed = 0
  let dead = 0

  for (const job of list) {
    if (!isOutboundEmailTemplateKey(job.template_key)) {
      await markDead(admin, job.id, 'unknown_template', job.attempts + 1)
      dead += 1
      continue
    }

    try {
      const resolved = await resolveOutboundEmail({
        id: job.id,
        template_key: job.template_key,
        payload: (job.payload ?? {}) as Record<string, unknown>,
        to_email: job.to_email,
      })

      if (!resolved) {
        const nextAttempts = job.attempts + 1
        if (nextAttempts >= MAX_SEND_ATTEMPTS) {
          await markDead(admin, job.id, 'unresolvable_or_no_recipient', nextAttempts)
          dead += 1
        } else {
          await markRetry(admin, job.id, 'unresolvable_or_no_recipient', nextAttempts)
          failed += 1
        }
        continue
      }

      const from = getEmailFromAddress()
      const result = await resend.emails.send({
        from,
        to: resolved.to,
        subject: resolved.subject,
        react: resolved.react,
        attachments: resolved.attachments,
      })

      if (result.error) {
        const msg = result.error.message ?? 'resend_error'
        const nextAttempts = job.attempts + 1
        if (nextAttempts >= MAX_SEND_ATTEMPTS) {
          await markDead(admin, job.id, msg, nextAttempts)
          dead += 1
        } else {
          await markRetry(admin, job.id, msg, nextAttempts)
          failed += 1
        }
        continue
      }

      await markSent(admin, job.id)
      sent += 1
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      console.error('[outbound-dispatch] job', job.id, msg)
      captureRouteException('admin', 'runOutboundDispatchJob.send', e)
      const nextAttempts = job.attempts + 1
      if (nextAttempts >= MAX_SEND_ATTEMPTS) {
        await markDead(admin, job.id, msg, nextAttempts)
        dead += 1
      } else {
        await markRetry(admin, job.id, msg, nextAttempts)
        failed += 1
      }
    }
  }

  return { claimed: list.length, sent, failed, dead, stale_reset: stale }
}
