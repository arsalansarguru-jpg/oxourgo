import type { Metadata } from 'next'

import { LoginView } from '@/features/auth/login-view'
import { safeNextPath } from '@/lib/auth/safe-next-path'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to Oxour Go — manage trips, verification, and account preferences.',
}

function decodeAuthError(raw: string | undefined): string | undefined {
  const s = raw?.trim()
  if (!s) return undefined
  try {
    return decodeURIComponent(s)
  } catch {
    return s
  }
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; error?: string }>
}) {
  const sp = await searchParams
  const redirectTo = safeNextPath(sp.redirect, '/dashboard')
  const initialAuthError = decodeAuthError(sp.error)

  return <LoginView initialAuthError={initialAuthError} redirectTo={redirectTo} />
}
