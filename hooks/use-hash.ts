'use client'

import { useEffect, useState } from 'react'

/** Client-only URL hash segment (without `#`), defaults to `fallback`. */
export function useHash(fallback = 'overview') {
  const [segment, setSegment] = useState(fallback)

  useEffect(() => {
    const read = () => setSegment(window.location.hash.replace('#', '') || fallback)
    read()
    window.addEventListener('hashchange', read)
    return () => window.removeEventListener('hashchange', read)
  }, [fallback])

  return segment
}
