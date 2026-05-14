/**
 * Whether `next/image` may optimize this URL (Supabase Storage, Unsplash, same-origin).
 * Unknown external hosts stay `unoptimized` to avoid runtime config errors.
 */
export function shouldOptimizeVehicleImageSrc(src: string): boolean {
  const s = src.trim()
  if (!s) return false
  if (s.startsWith('/')) return true
  if (s.endsWith('.svg')) return false
  try {
    const u = new URL(s)
    if (u.hostname.endsWith('supabase.co') && u.pathname.includes('/storage/v1/object/')) return true
    if (u.hostname === 'images.unsplash.com') return true
    return false
  } catch {
    return false
  }
}
