import 'server-only'

/**
 * Heuristic date/location extraction when AI is unavailable or as validation hints.
 * Supports common India rental phrasing.
 */

export type ExtractedTripSlots = {
  pickupAtIso?: string
  returnAtIso?: string
  pickupLocation?: string
  returnLocation?: string
  vehicleChoiceIndex?: number
}

const MONTHS: Record<string, number> = {
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  sept: 8,
  september: 8,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11,
}

function parseDayMonth(text: string, year = new Date().getFullYear()): Date | null {
  const m = text.match(/(\d{1,2})\s+([a-z]+)(?:\s+(\d{4}))?/i)
  if (!m) return null
  const day = Number(m[1])
  const mon = MONTHS[m[2].toLowerCase()]
  if (mon === undefined || day < 1 || day > 31) return null
  const y = m[3] ? Number(m[3]) : year
  return new Date(y, mon, day, 10, 0, 0, 0)
}

function toLocalIso(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function extractTripSlotsFromText(text: string): ExtractedTripSlots {
  const lower = text.toLowerCase()
  const out: ExtractedTripSlots = {}

  const choice = lower.match(/\b(?:option|#|number)\s*(\d)\b/) ?? lower.match(/^(\d)\s*$/)
  if (choice) {
    out.vehicleChoiceIndex = Number(choice[1])
  }

  const hubMatch = lower.match(/\b(?:hub|pickup|from)\s*(?:at|in)?\s*([a-z][a-z\s]{2,24})/i)
  if (hubMatch) {
    out.pickupLocation = hubMatch[1].trim()
    out.returnLocation = hubMatch[1].trim()
  }

  const range =
    lower.match(/(\d{1,2}\s+[a-z]+(?:\s+\d{4})?)(?:\s+\d{1,2}:\d{2})?\s*(?:to|–|-|—)\s*(\d{1,2}\s+[a-z]+(?:\s+\d{4})?)(?:\s+\d{1,2}:\d{2})?/i) ??
    lower.match(/from\s+(\d{1,2}\s+[a-z]+(?:\s+\d{4})?)(?:\s+\d{1,2}:\d{2})?\s+(?:to|till|until)\s+(\d{1,2}\s+[a-z]+(?:\s+\d{4})?)(?:\s+\d{1,2}:\d{2})?/i)

  if (range) {
    const pu = parseDayMonth(range[1])
    const re = parseDayMonth(range[2])
    if (pu) out.pickupAtIso = toLocalIso(pu)
    if (re) out.returnAtIso = toLocalIso(re)
  }

  return out
}
