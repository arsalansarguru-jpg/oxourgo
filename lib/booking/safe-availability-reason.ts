/**
 * Never surface raw RPC / database strings in the booking UI.
 * Allows short, human-written reasons from our API only.
 */
export function safeAvailabilityReason(reason: string | undefined | null): string | undefined {
  const t = reason?.trim()
  if (!t) return undefined
  if (t.length > 140) return undefined
  if (/postgres|supabase|pgrst|rpc|internal|stack|error\s*code|exception/i.test(t)) return undefined
  return t
}
