import { createServerClient } from '@supabase/ssr'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import {
  APP_ROLE_APP_METADATA_KEY,
  parseAppAuthRole,
  roleAtLeast,
  type AppAuthRole,
} from '@/lib/auth/roles'
import { getSupabasePublicEnv } from '@/lib/env/supabase-public'
import type { Database } from '@/lib/supabase/database.types'
import { updateSession } from '@/lib/supabase/middleware'

const PROTECTED_PREFIXES = ['/dashboard', '/admin'] as const

/** Fail-closed destination when public Supabase env is missing (must stay outside protected prefixes). */
const CONFIG_UNAVAILABLE_PATH = '/system/unavailable'

function needsAuthenticatedUser(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))
}

function appRoleFromUser(user: { app_metadata?: Record<string, unknown> }): AppAuthRole {
  const meta = user.app_metadata ?? {}
  const raw =
    (typeof meta[APP_ROLE_APP_METADATA_KEY] === 'string' ? meta[APP_ROLE_APP_METADATA_KEY] : undefined) ??
    (typeof meta.role === 'string' ? meta.role : undefined)
  return parseAppAuthRole(raw) ?? 'customer'
}

export async function middleware(request: NextRequest) {
  const response = await updateSession(request)

  if (!needsAuthenticatedUser(request.nextUrl.pathname)) {
    return response
  }

  const pair = getSupabasePublicEnv()
  if (!pair) {
    const maintenance = new URL(CONFIG_UNAVAILABLE_PATH, request.url)
    const redirectResponse = NextResponse.redirect(maintenance)
    response.cookies.getAll().forEach((c) => {
      redirectResponse.cookies.set(c.name, c.value)
    })
    return redirectResponse
  }

  const supabase = createServerClient<Database>(pair.url, pair.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options)
        })
        Object.entries(headers).forEach(([key, value]) => {
          response.headers.set(key, value)
        })
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    const login = new URL('/login', request.url)
    login.searchParams.set('redirect', `${request.nextUrl.pathname}${request.nextUrl.search}`)
    const redirectResponse = NextResponse.redirect(login)
    response.cookies.getAll().forEach((c) => {
      redirectResponse.cookies.set(c.name, c.value)
    })
    return redirectResponse
  }

  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!roleAtLeast(appRoleFromUser(user), 'ops_admin')) {
      const denied = new URL('/dashboard', request.url)
      denied.searchParams.set('error', 'forbidden')
      const redirectResponse = NextResponse.redirect(denied)
      response.cookies.getAll().forEach((c) => {
        redirectResponse.cookies.set(c.name, c.value)
      })
      return redirectResponse
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
