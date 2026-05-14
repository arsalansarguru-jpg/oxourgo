import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { safeNextPath } from '@/lib/auth/safe-next-path'
import { readSupabasePublicEnv } from '@/lib/env/supabase-public'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const origin = url.origin
  const next = safeNextPath(url.searchParams.get('next'), '/dashboard')

  const oauthError = url.searchParams.get('error')
  const oauthDesc = url.searchParams.get('error_description')
  if (oauthError) {
    const message = oauthDesc ?? oauthError
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(message)}`, origin))
  }

  if (!readSupabasePublicEnv()) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent('Sign-in is temporarily unavailable.')}`, origin),
    )
  }

  const code = url.searchParams.get('code')
  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      console.error('[auth/callback] exchangeCodeForSession', error.message, error.code)
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent('Sign-in failed. Please try again.')}`, origin),
      )
    }
  }

  return NextResponse.redirect(new URL(next, origin))
}
