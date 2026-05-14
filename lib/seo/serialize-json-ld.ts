/** Safe JSON-LD serialization for `next/script` or inline script tags. */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}
