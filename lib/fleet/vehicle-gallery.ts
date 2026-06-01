import { getPublicStorageObjectUrl } from '@/lib/supabase/storage-public-url'
import { VEHICLE_IMAGE_FALLBACK } from '@/constants/vehicle-media'

export const VEHICLE_GALLERY_LABELS = [
  { id: 'exterior', label: 'Exterior' },
  { id: 'interior', label: 'Interior' },
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'rear', label: 'Rear / boot' },
  { id: 'other', label: 'Other' },
] as const

export type VehicleGalleryLabelId = (typeof VEHICLE_GALLERY_LABELS)[number]['id']

export type VehicleGalleryImage = {
  path: string
  label: VehicleGalleryLabelId | string
}

export function normalizeVehicleGalleryImages(raw: unknown): VehicleGalleryImage[] {
  if (!Array.isArray(raw)) return []
  const out: VehicleGalleryImage[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const path = String((item as { path?: unknown }).path ?? '').trim()
    if (!path) continue
    const label = String((item as { label?: unknown }).label ?? 'other').trim() || 'other'
    out.push({ path, label })
  }
  return out.slice(0, 16)
}

export function galleryLabelDisplay(label: string): string {
  const found = VEHICLE_GALLERY_LABELS.find((l) => l.id === label)
  return found?.label ?? label.replace(/_/g, ' ')
}

export function resolveGalleryPathUrl(path: string): string | null {
  const raw = path.trim()
  if (!raw) return null
  if (/^https?:\/\//i.test(raw)) return raw
  return getPublicStorageObjectUrl('fleet', raw)
}

/** Build unique public URLs for booking detail carousel (cover first). */
export function resolveVehicleGalleryUrls(
  coverPath: string | null | undefined,
  galleryImages: unknown,
): string[] {
  const primary = coverPath?.trim()
    ? resolveGalleryPathUrl(coverPath) ?? VEHICLE_IMAGE_FALLBACK
    : VEHICLE_IMAGE_FALLBACK

  const items = normalizeVehicleGalleryImages(galleryImages)
  const fromGallery = items
    .map((g) => resolveGalleryPathUrl(g.path))
    .filter((u): u is string => Boolean(u))

  const seen = new Set<string>()
  const urls: string[] = []
  for (const u of [primary, ...fromGallery]) {
    if (!u || u === VEHICLE_IMAGE_FALLBACK || seen.has(u)) continue
    seen.add(u)
    urls.push(u)
  }

  if (urls.length === 0) return [VEHICLE_IMAGE_FALLBACK]
  return urls.slice(0, 16)
}
