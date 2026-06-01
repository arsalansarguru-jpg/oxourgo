import type { Metadata } from 'next'

/** Per-route admin tab title (feeds layout template `%s | Oxour Go Admin`). */
export function adminPageMetadata(title: string): Metadata {
  return { title }
}
