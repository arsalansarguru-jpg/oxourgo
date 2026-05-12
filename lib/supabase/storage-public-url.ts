import { readSupabasePublicEnv } from '@/lib/env/supabase-public'

/** Builds a public object URL for Supabase Storage (`public` buckets). */
export function getPublicStorageObjectUrl(bucketId: string, objectPath: string): string | null {
  const env = readSupabasePublicEnv()
  if (!env || !objectPath.trim()) return null
  const encoded = objectPath
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/')
  return `${env.url}/storage/v1/object/public/${bucketId}/${encoded}`
}
