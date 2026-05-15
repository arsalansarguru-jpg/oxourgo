import 'server-only'

import { sumViolationAmounts, type ViolationEventRow, type ViolationRow } from '@/lib/booking/violations'
import { createClient } from '@/lib/supabase/server'

export type CustomerBookingViolationsBundle = {
  violations: ViolationRow[]
  events: ViolationEventRow[]
  challanSignedUrls: Record<string, string>
  summary: ReturnType<typeof sumViolationAmounts>
}

const violationSelect = `
  id,
  booking_id,
  user_id,
  violation_type,
  amount_rupees,
  reason,
  violation_date,
  authority_source,
  notes,
  status,
  challan_storage_path,
  challan_mime,
  challan_file_name,
  amount_paid_rupees,
  amount_deducted_rupees,
  customer_notified_at,
  paid_at,
  deducted_at,
  resolved_at,
  created_at,
  updated_at
`

function mapEvents(
  rows: Array<{
    id: string
    violation_id: string
    booking_id: string
    event_type: string
    payload: unknown
    created_at: string
  }>,
): ViolationEventRow[] {
  return rows.map((e) => ({
    id: e.id,
    violation_id: e.violation_id,
    booking_id: e.booking_id,
    event_type: e.event_type,
    payload: (e.payload && typeof e.payload === 'object' ? e.payload : {}) as Record<string, unknown>,
    actor_user_id: null,
    created_at: e.created_at,
  }))
}

export async function customerGetBookingViolationsBundle(
  bookingId: string,
  userId: string,
): Promise<CustomerBookingViolationsBundle> {
  const supabase = await createClient()
  const empty = { violations: [], events: [], challanSignedUrls: {}, summary: sumViolationAmounts([]) }

  const { data: booking, error: bErr } = await supabase
    .from('bookings')
    .select('id')
    .eq('id', bookingId)
    .eq('user_id', userId)
    .maybeSingle()

  if (bErr || !booking) return empty

  const { data: violations, error: vErr } = await supabase
    .from('booking_violations')
    .select(violationSelect)
    .eq('booking_id', bookingId)
    .neq('status', 'pending')
    .order('created_at', { ascending: false })

  if (vErr) return empty

  const list = (violations ?? []) as ViolationRow[]
  const summary = sumViolationAmounts(list)

  const { data: events } = await supabase
    .from('booking_violation_events')
    .select('id, violation_id, booking_id, event_type, payload, created_at')
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: false })
    .limit(100)

  const challanSignedUrls: Record<string, string> = {}
  await Promise.all(
    list
      .filter((v) => v.challan_storage_path && v.status !== 'pending')
      .map(async (v) => {
        const { data, error } = await supabase.storage
          .from('booking_violation_challans')
          .createSignedUrl(v.challan_storage_path!, 3600)
        if (!error && data?.signedUrl) challanSignedUrls[v.id] = data.signedUrl
      }),
  )

  return {
    violations: list,
    events: mapEvents(events ?? []),
    challanSignedUrls,
    summary,
  }
}
