import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { captureServerPosthogEvent } from '@/lib/analytics/posthog-server'
import { POSTHOG_EVENTS } from '@/lib/analytics/posthog-events'
import { getAuthCallbackOrigin } from '@/lib/auth/canonical-origin'
import { debugLogRoleResolution } from '@/lib/auth/role-debug'
import { resolvePostLoginPath } from '@/lib/auth/post-login-path'
import { resolveAuthRoleWithDebug } from '@/lib/auth/roles'
import { readSupabasePublicEnv } from '@/lib/env/supabase-public'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const origin = getAuthCallbackOrigin(url.origin)
  const requestedNext = url.searchParams.get('next')

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
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      const roleDebug = resolveAuthRoleWithDebug(
        user.app_metadata as Record<string, unknown> | undefined,
        user.user_metadata as Record<string, unknown> | undefined,
      )
      debugLogRoleResolution('auth/callback', {
        userId: user.id,
        email: user.email,
        app_metadata: user.app_metadata,
        user_metadata: user.user_metadata,
        candidates: roleDebug.candidates,
        resolved: roleDebug.resolved,
        requestedNext,
      })
      await captureServerPosthogEvent({
        distinctId: user.id,
        event: POSTHOG_EVENTS.loginCompleted,
        properties: { method: 'oauth_or_magic_link', app_role: roleDebug.resolved },
      })
      const destination = resolvePostLoginPath(roleDebug.resolved, requestedNext)
      return NextResponse.redirect(new URL(destination, origin))
    }
  }

  return NextResponse.redirect(new URL(resolvePostLoginPath('customer', requestedNext), origin))
}
