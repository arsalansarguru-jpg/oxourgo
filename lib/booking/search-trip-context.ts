import { MIN_LEAD_HOURS } from '@/lib/booking/constants'
import { toDatetimeLocalValue } from '@/lib/booking/dates'

function parseYmd(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim())
  if (!m) return null
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  return Number.isNaN(d.getTime()) ? null : d
}

/** Map homepage / fleet `from` & `to` date params into datetime-local defaults. */
export function datetimeRangeFromDateParams(from?: string, to?: string): {
  pickup?: string
  returnAt?: string
} {
  const fromDay = from ? parseYmd(from) : null
  const toDay = to ? parseYmd(to) : null
  if (!fromDay) return {}

  const now = new Date()
  const minPickup = new Date(now.getTime() + MIN_LEAD_HOURS * 60 * 60 * 1000)
  minPickup.setMinutes(0, 0, 0)

  const pickup = new Date(fromDay)
  pickup.setHours(10, 0, 0, 0)
  const pickupMs = Math.max(pickup.getTime(), minPickup.getTime())
  const pickupDate = new Date(pickupMs)

  let returnDate: Date
  if (toDay && toDay > fromDay) {
    returnDate = new Date(toDay)
    returnDate.setHours(pickupDate.getHours(), 0, 0, 0)
  } else {
    returnDate = new Date(pickupDate.getTime() + 2 * 24 * 60 * 60 * 1000)
  }

  return {
    pickup: toDatetimeLocalValue(pickupDate),
    returnAt: toDatetimeLocalValue(returnDate),
  }
}
