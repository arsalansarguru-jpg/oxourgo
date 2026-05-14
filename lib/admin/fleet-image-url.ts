import { getPublicStorageObjectUrl } from '@/lib/supabase/storage-public-url'

/** Resolve `vehicles.image` for display (public URL or fleet bucket path). */
export function fleetVehicleImageUrl(image: string | null | undefined): string | null {
  const raw = image?.trim()
  if (!raw) return null
  if (/^https?:\/\//i.test(raw)) return raw
  return getPublicStorageObjectUrl('fleet', raw)
}
