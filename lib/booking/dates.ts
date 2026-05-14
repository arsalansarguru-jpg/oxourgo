import { MAX_RENTAL_DAYS, MIN_LEAD_HOURS } from '@/lib/booking/constants'

export function rentalDaysBetween(pickupMs: number, returnMs: number): number {
  if (!Number.isFinite(pickupMs) || !Number.isFinite(returnMs) || returnMs <= pickupMs) return 0
  const msPerDay = 1000 * 60 * 60 * 24
  return Math.max(1, Math.min(MAX_RENTAL_DAYS, Math.ceil((returnMs - pickupMs) / msPerDay)))
}

export function defaultPickupReturnIso(): { pickup: string; return: string } {
  const now = new Date()
  const pickup = new Date(now.getTime() + MIN_LEAD_HOURS * 60 * 60 * 1000)
  pickup.setMinutes(0, 0, 0)
  const ret = new Date(pickup.getTime() + 2 * 24 * 60 * 60 * 1000)
  ret.setHours(pickup.getHours(), 0, 0, 0)
  return { pickup: toDatetimeLocalValue(pickup), return: toDatetimeLocalValue(ret) }
}

/** `datetime-local` value in local timezone (YYYY-MM-DDTHH:mm). */
export function toDatetimeLocalValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export type DateValidationResult =
  | { ok: true; pickupMs: number; returnMs: number; rentalDays: number }
  | { ok: false; message: string }

export function validateTripWindow(
  pickupIso: string,
  returnIso: string,
  nowMs: number = Date.now(),
): DateValidationResult {
  const pickupMs = new Date(pickupIso).getTime()
  const returnMs = new Date(returnIso).getTime()
  if (!Number.isFinite(pickupMs) || !Number.isFinite(returnMs)) {
    return { ok: false, message: 'Enter valid pickup and return times.' }
  }
  if (returnMs <= pickupMs) {
    return { ok: false, message: 'Return must be after pickup.' }
  }
  if (pickupMs < nowMs) {
    return { ok: false, message: 'Pickup cannot be in the past.' }
  }
  const minPickup = nowMs + MIN_LEAD_HOURS * 60 * 60 * 1000
  if (pickupMs < minPickup) {
    return { ok: false, message: `Pickup must be at least ${MIN_LEAD_HOURS} hours from now.` }
  }
  const rentalDays = rentalDaysBetween(pickupMs, returnMs)
  if (rentalDays < 1) {
    return { ok: false, message: 'Minimum rental is one day.' }
  }
  if (rentalDays > MAX_RENTAL_DAYS) {
    return { ok: false, message: `Maximum rental is ${MAX_RENTAL_DAYS} days.` }
  }
  return { ok: true, pickupMs, returnMs, rentalDays }
}
