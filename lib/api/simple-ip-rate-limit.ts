type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()
const MAX_BUCKETS = 5000

function pruneExpired(now: number): void {
  for (const [k, b] of buckets) {
    if (now > b.resetAt) buckets.delete(k)
  }
}

function trimBucketCount(): void {
  if (buckets.size <= MAX_BUCKETS) return
  const overflow = buckets.size - MAX_BUCKETS + 200
  let removed = 0
  for (const k of buckets.keys()) {
    buckets.delete(k)
    removed++
    if (removed >= overflow) break
  }
}

/**
 * Fixed-window rate limiter (in-memory). Best-effort for serverless — each instance has its own map.
 * Use for abuse reduction on public GET endpoints (never as the sole security control).
 */
export function allowIpRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  pruneExpired(now)
  trimBucketCount()

  const b = buckets.get(key)
  if (!b || now > b.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (b.count >= limit) return false
  b.count += 1
  return true
}

export function clientIpFromRequestHeaders(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  if (forwarded) return forwarded
  const realIp = headers.get('x-real-ip')?.trim()
  if (realIp) return realIp
  return 'unknown'
}
