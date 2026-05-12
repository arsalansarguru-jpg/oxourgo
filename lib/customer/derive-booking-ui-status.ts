export type CustomerBookingUiStatus =
  | 'active'
  | 'upcoming'
  | 'pending_review'
  | 'completed'
  | 'cancelled'

/**
 * Maps DB `booking_status` + trip window to dashboard UI segments.
 */
export function deriveCustomerBookingUiStatus(row: {
  booking_status: string
  pickup_at: string
  return_at: string
}): CustomerBookingUiStatus {
  if (row.booking_status === 'cancelled') return 'cancelled'
  if (row.booking_status === 'completed') return 'completed'
  if (row.booking_status === 'pending_payment') return 'pending_review'

  const now = Date.now()
  const pickup = new Date(row.pickup_at).getTime()
  const ret = new Date(row.return_at).getTime()

  if (now > ret) return 'completed'
  if (now >= pickup && now <= ret) return 'active'
  return 'upcoming'
}
