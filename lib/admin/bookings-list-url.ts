/** Build `/admin/bookings` query string (stable key order). */
export function stringifyBookingsQuery(input: {
  status?: string
  payment?: string
  source?: string
  q?: string
  page?: number
  per?: number
}): string {
  const sp = new URLSearchParams()
  if (input.status?.trim()) sp.set('status', input.status.trim())
  if (input.payment?.trim()) sp.set('payment', input.payment.trim())
  if (input.source?.trim()) sp.set('source', input.source.trim())
  if (input.q?.trim()) sp.set('q', input.q.trim())
  if (input.page != null && input.page > 1) sp.set('page', String(Math.floor(input.page)))
  if (input.per != null && input.per !== 25) sp.set('per', String(input.per))
  const s = sp.toString()
  return s ? `?${s}` : ''
}
