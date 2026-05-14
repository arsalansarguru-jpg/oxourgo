export type CustomerBookingUiStatus =
  | 'active'
  | 'upcoming'
  | 'pending_review'
  | 'completed'
  | 'cancelled'

/**
 * Maps DB `booking_status` + trip window (+ handover timestamps when present) to dashboard UI segments.
 */
export function deriveCustomerBookingUiStatus(row: {
  booking_status: string
  pickup_date: string
  return_date: string
  handed_over_at?: string | null
  returned_at?: string | null
}): CustomerBookingUiStatus {
  if (row.booking_status === 'cancelled') return 'cancelled'
  if (row.booking_status === 'completed') return 'completed'
  if (row.booking_status === 'active') return 'active'
  if (row.booking_status === 'pending_payment') return 'pending_review'

  const now = Date.now()
  const pickup = new Date(row.pickup_date).getTime()
  const ret = new Date(row.return_date).getTime()

  // confirmed: approved / pickup scheduled — calendar window still useful for messaging
  if (row.booking_status === 'confirmed') {
    if (row.handed_over_at) return 'active'
    if (now > ret) return 'completed'
    if (now >= pickup && now <= ret) return 'active'
    return 'upcoming'
  }

  if (now > ret) return 'completed'
  if (now >= pickup && now <= ret) return 'active'
  return 'upcoming'
}
