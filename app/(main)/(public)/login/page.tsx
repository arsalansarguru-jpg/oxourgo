import type { Metadata } from 'next'

import { LoginView } from '@/features/auth/login-view'
import { resolvePostLoginPath } from '@/lib/auth/post-login-path'
import { getAuthSessionSummary } from '@/lib/auth/server'
import { redirect } from 'next/navigation'

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
  const initialAuthError = decodeAuthError(sp.error)

  const summary = await getAuthSessionSummary()
  if (summary) {
    redirect(resolvePostLoginPath(summary.appRole, sp.redirect))
  }

  const redirectTo = resolvePostLoginPath('customer', sp.redirect)

  return <LoginView initialAuthError={initialAuthError} redirectTo={redirectTo} />
}
