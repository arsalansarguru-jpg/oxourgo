/**
 * Wraps `fetch` so public Supabase reads fail fast instead of hanging on DNS / TLS stalls.
 */
export function createFetchWithTimeout(timeoutMs: number): typeof fetch {
  return (input, init) => {
    const outer = new AbortController()
    const timer = setTimeout(() => outer.abort(), timeoutMs)
    const inner = init?.signal
    if (!inner) {
      return fetch(input, { ...init, signal: outer.signal }).finally(() => clearTimeout(timer))
    }
    const combined = new AbortController()
    const onAbort = () => combined.abort()
    inner.addEventListener('abort', onAbort)
    outer.signal.addEventListener('abort', onAbort)
    if (inner.aborted || outer.signal.aborted) combined.abort()
    return fetch(input, { ...init, signal: combined.signal }).finally(() => {
      clearTimeout(timer)
      inner.removeEventListener('abort', onAbort)
      outer.signal.removeEventListener('abort', onAbort)
    })
  }
}
