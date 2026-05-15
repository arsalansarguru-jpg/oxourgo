import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/lib/supabase/database.types'

const BUCKET = 'booking_inspection'
const TTL = 120

export type InspectionPhotoWithUrl = {
  id: string
  phase: string
  slot: string
  signedUrl: string | null
}

export async function signBookingInspectionPhotosForUser(
  supabase: SupabaseClient<Database>,
  paths: { id: string; phase: string; slot: string; storage_path: string }[],
): Promise<InspectionPhotoWithUrl[]> {
  const out: InspectionPhotoWithUrl[] = []
  for (const p of paths) {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(p.storage_path, TTL)
    if (error) {
      console.error('[signBookingInspectionPhotosForUser]', p.storage_path, error.message)
      out.push({ id: p.id, phase: p.phase, slot: p.slot, signedUrl: null })
    } else {
      out.push({ id: p.id, phase: p.phase, slot: p.slot, signedUrl: data?.signedUrl ?? null })
    }
  }
  return out
}

export async function signBookingInspectionObjectForUser(
  supabase: SupabaseClient<Database>,
  storagePath: string | null | undefined,
): Promise<string | null> {
  if (!storagePath?.trim()) return null
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(storagePath.trim(), TTL)
  if (error || !data?.signedUrl) {
    if (error) console.error('[signBookingInspectionObjectForUser]', storagePath, error.message)
    return null
  }
  return data.signedUrl
}
