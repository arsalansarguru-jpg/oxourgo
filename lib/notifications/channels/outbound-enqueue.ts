import 'server-only'

import type { Json } from '@/lib/supabase/database.types'
import { createAdminClient } from '@/lib/supabase/admin'

import type { OutboundEmailTemplateKey } from '@/lib/email/template-keys'

export type OutboundJobInsert = {
  idempotencyKey: string
  templateKey: OutboundEmailTemplateKey
  payload: Json
}

const RATE_WINDOW_MS = 60 * 60 * 1000
const RATE_MAX_PER_USER_TEMPLATE = 12

async function countRecentSameUserTemplate(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  templateKey: string,
): Promise<number> {
  const since = new Date(Date.now() - RATE_WINDOW_MS).toISOString()
  const { data, error } = await admin
    .from('outbound_jobs')
    .select('id, payload')
    .eq('template_key', templateKey)
    .gte('created_at', since)
    .in('status', ['pending', 'processing', 'sent'])
    .limit(80)

  if (error || !data) return 0
  return data.filter((row) => {
    const p = row.payload as { user_id?: string } | null
    return p?.user_id === userId
  }).length
}

/**
 * Queue an outbound email (idempotent). Skips when `RESEND_API_KEY` is unset.
 * Never throws — failures are logged only.
 */
export async function enqueueOutboundEmail(input: OutboundJobInsert): Promise<{ ok: boolean; skipped?: boolean }> {
  if (!process.env.RESEND_API_KEY?.trim()) {
    return { ok: true, skipped: true }
  }

  const admin = createAdminClient()
  const payload = input.payload as { user_id?: string }

  if (payload.user_id) {
    const n = await countRecentSameUserTemplate(admin, payload.user_id, input.templateKey)
    if (n >= RATE_MAX_PER_USER_TEMPLATE) {
      console.warn('[enqueueOutboundEmail] rate_limited', input.templateKey, payload.user_id)
      return { ok: true, skipped: true }
    }
  }

  const { error } = await admin.from('outbound_jobs').insert({
    channel: 'email',
    template_key: input.templateKey,
    idempotency_key: input.idempotencyKey,
    payload: input.payload,
    status: 'pending',
    next_run_at: new Date().toISOString(),
  })

  if (error) {
    if ((error as { code?: string }).code === '23505') {
      return { ok: true, skipped: true }
    }
    console.error('[enqueueOutboundEmail]', error.message)
    return { ok: false }
  }

  return { ok: true }
}

export function parseOpsAlertEmails(): string[] {
  const raw = process.env.OPS_ALERT_EMAILS?.trim() || process.env.OPS_ALERT_EMAIL?.trim() || ''
  return raw.split(/[,;\s]+/).map((s) => s.trim()).filter(Boolean)
}

export function getEmailFromAddress(): string {
  const v = process.env.EMAIL_FROM?.trim()
  if (v) return v
  return `Oxour Go <hello@oxourgo.com>`
}
