'use client'

import { useCallback, useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'

import { isAdmin as isAdminRole, type AppAuthRole } from '@/lib/auth/roles'
import { isStaffRole as isStaffRoleCheck } from '@/lib/auth/permissions'
import { resolveClientAuthRole } from '@/lib/auth/resolve-client-role'
import { useSupabase } from '@/hooks/use-supabase'

export type ResolvedAppRoleState = {
  user: User | null
  appRole: AppAuthRole
  isStaff: boolean
  isAdmin: boolean
  ready: boolean
  refresh: () => Promise<void>
}

/**
 * Client RBAC: refresh session, merge JWT claims, resolve role on every auth change.
 */
export function useResolvedAppRole(): ResolvedAppRoleState {
  const supabase = useSupabase()
  const [user, setUser] = useState<User | null>(null)
  const [appRole, setAppRole] = useState<AppAuthRole>('customer')
  const [ready, setReady] = useState(false)

  const refresh = useCallback(
    async (opts?: { refresh?: boolean }) => {
      if (!supabase) {
        setUser(null)
        setAppRole('customer')
        setReady(true)
        return
      }
      const resolved = await resolveClientAuthRole(supabase, { refresh: opts?.refresh })
      setUser(resolved.user)
      setAppRole(resolved.appRole)
      setReady(true)
    },
    [supabase],
  )

  useEffect(() => {
    if (!supabase) {
      setUser(null)
      setAppRole('customer')
      setReady(true)
      return
    }

    let cancelled = false
    void refresh().then(() => {
      if (!cancelled) setReady(true)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setUser(null)
        setAppRole('customer')
        setReady(true)
        return
      }
      const shouldRefresh =
        event === 'SIGNED_IN' ||
        event === 'TOKEN_REFRESHED' ||
        event === 'USER_UPDATED'
      void refresh({ refresh: shouldRefresh })
    })

    const onVisible = () => {
      if (document.visibilityState === 'visible') void refresh()
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      cancelled = true
      subscription.unsubscribe()
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [supabase, refresh])

  return {
    user,
    appRole,
    isStaff: isStaffRoleCheck(appRole),
    isAdmin: isAdminRole(appRole),
    ready,
    refresh,
  }
}
