'use client'

import { useEffect, useState } from 'react'

const DEFAULT_MS = 15000

/**
 * Flips to true after `ms` so slow client fetches can show an error fallback.
 */
export function useLoadingTimeout(loading: boolean, ms = DEFAULT_MS): boolean {
  const [timedOut, setTimedOut] = useState(false)

  useEffect(() => {
    if (!loading) {
      setTimedOut(false)
      return
    }
    const timer = setTimeout(() => setTimedOut(true), ms)
    return () => clearTimeout(timer)
  }, [loading, ms])

  return timedOut
}
