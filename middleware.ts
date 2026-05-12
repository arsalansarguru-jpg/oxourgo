import { createServerClient } from '@supabase/ssr'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { getSupabasePublicEnv } from '@/lib/env/supabase-public'
import type { Database } from '@/lib/supabase/database.types'
import { updateSession } from '@/lib/supabase/middleware'

const PROTECTED_PREFIXES = ['/dashboard', '/admin'] as const

function needsAuthenticatedUser(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))
}

export async function middleware(request: NextRequest) {
  const response = await updateSession(request)

  if (!needsAuthenticatedUser(request.nextUrl.pathname)) {
    return response
  }

  const pair = getSupabasePublicEnv()
  if (!pair) {
    return response
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

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
