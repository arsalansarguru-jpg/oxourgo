'use client'

import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'

import { useSupabase } from '@/hooks/use-supabase'

/** Browser Supabase session user; updates on sign-in/out and token refresh. */
export function useSupabaseAuthUser(): { user: User | null; ready: boolean } {
  const supabase = useSupabase()
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!supabase) {
      setUser(null)
      setReady(true)
      return
    }

    let cancelled = false
    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (!cancelled) {
        setUser(session?.user ?? null)
        setReady(true)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setReady(true)
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [supabase])

  return { user, ready }
}
