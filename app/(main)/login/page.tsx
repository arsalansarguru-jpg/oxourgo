import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { LoginView } from '@/features/auth/login-view'
import { sanitizeUrlAuthError } from '@/lib/auth/sanitize-url-auth-error'
import { safeNextPath } from '@/lib/auth/safe-next-path'
import { readSupabasePublicEnv } from '@/lib/env/supabase-public'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Secure sign-in to Oxour Go — luxury self-drive in Mumbai.',
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; redirect?: string }>
}) {
  const q = await searchParams

  if (readSupabasePublicEnv()) {
    try {
      const supabase = await createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        redirect(safeNextPath(q.redirect, '/dashboard'))
      }
    } catch {
      // Misconfigured env: still render login so the UI can surface configuration hints.
    }
  }

  return <LoginView initialAuthError={sanitizeUrlAuthError(q.error)} redirectTo={q.redirect} />
}
