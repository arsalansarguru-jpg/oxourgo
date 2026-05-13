'use client'

import { useEffect, useState } from 'react'

import { useSupabase } from '@/hooks/use-supabase'

export function SupabaseBrowserCheck() {
  const supabase = useSupabase()
  const [payload, setPayload] = useState<string>('Checking browser client…')

  useEffect(() => {
    if (!supabase) {
      setPayload(
        JSON.stringify(
          {
            source: 'browser',
            configured: false,
            hint: 'Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or PUBLISHABLE_KEY) in .env.local.',
          },
          null,
          2,
        ),
      )
      return
    }

    let cancelled = false

    void (async () => {
      try {
        const { data, error } = await supabase.auth.getClaims()
        if (cancelled) return
        if (error) {
          setPayload(JSON.stringify({ source: 'browser', error: error.message, code: error.code }, null, 2))
          return
        }
        setPayload(
          JSON.stringify(
            {
              source: 'browser',
              ok: true,
              hasClaims: Boolean(data?.claims),
            },
            null,
            2,
          ),
        )
      } catch (e) {
        if (!cancelled) setPayload(JSON.stringify({ source: 'browser', error: String(e) }, null, 2))
      }
    })()

    return () => {
      cancelled = true
    }
  }, [supabase])

  return (
    <pre className="max-h-64 overflow-auto rounded-xl border border-stroke bg-matte/80 p-4 text-left text-[12px] leading-relaxed text-muted">
      {payload}
    </pre>
  )
}
