import type { Json } from '@/lib/supabase/database.types'

export const INSPECTION_PHOTO_SLOTS = ['front', 'rear', 'left', 'right', 'interior'] as const
export type InspectionPhotoSlot = (typeof INSPECTION_PHOTO_SLOTS)[number]

export const INSPECTION_PHASES = ['pickup', 'return'] as const
export type InspectionPhase = (typeof INSPECTION_PHASES)[number]

export type ConditionNotesShape = {
  scratches?: string
  dents?: string
  fuelNote?: string
  cleanliness?: string
}

export function parseConditionNotes(raw: Json | null | undefined): ConditionNotesShape {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const o = raw as Record<string, unknown>
  const str = (k: string) => (typeof o[k] === 'string' ? (o[k] as string) : undefined)
  return {
    scratches: str('scratches'),
    dents: str('dents'),
    fuelNote: str('fuelNote'),
    cleanliness: str('cleanliness'),
  }
}

export function conditionNotesToJson(n: ConditionNotesShape): Json {
  return {
    scratches: n.scratches ?? '',
    dents: n.dents ?? '',
    fuelNote: n.fuelNote ?? '',
    cleanliness: n.cleanliness ?? '',
  }
}

/** Pickup checklist keys required before handover (merged into `pickup_checklist` JSON). */
export const PICKUP_INSPECTION_CHECKLIST_KEYS = [
  'kyc_verified',
  'payment_received',
  'driving_license_checked',
  'fuel_level_recorded',
  'odometer_recorded',
] as const

/** Return checklist keys required before return checkpoint. */
export const RETURN_INSPECTION_CHECKLIST_KEYS = [
  'fuel_checked',
  'damages_checked',
  'cleanliness_checked',
  'odometer_checked',
  'keys_returned',
] as const
