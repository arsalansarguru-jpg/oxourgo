import { createServerClient } from '@supabase/ssr'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { canAccessAdminPath, appRoleFromJwtMetadata } from '@/lib/auth/route-access'
import { getBusinessWhatsAppUrl } from '@/lib/business-contact'
import { isStaffRole } from '@/lib/auth/permissions'
import { getSupabasePublicEnv } from '@/lib/env/supabase-public'
import { isSoftLaunchDisabledRoute, softLaunchInquiryMessageForPath } from '@/lib/soft-launch/disabled-routes'
import type { Database } from '@/lib/supabase/database.types'
import { updateSession } from '@/lib/supabase/middleware'

const PROTECTED_PREFIXES = ['/dashboard', '/admin'] as const

/** Fail-closed destination when public Supabase env is missing (must stay outside protected prefixes). */
const CONFIG_UNAVAILABLE_PATH = '/system/unavailable'

function needsAuthenticatedUser(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  if (isSoftLaunchDisabledRoute(pathname)) {
    const message = softLaunchInquiryMessageForPath(pathname)
    return NextResponse.redirect(getBusinessWhatsAppUrl(message))
  }

  const response = await updateSession(request)

  if (!needsAuthenticatedUser(pathname)) {
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

  if (pathname.startsWith('/admin')) {
    const appRole = appRoleFromJwtMetadata(user.app_metadata as Record<string, unknown> | undefined)

    if (!isStaffRole(appRole)) {
      const denied = new URL('/dashboard', request.url)
      denied.searchParams.set('error', 'forbidden')
      const redirectResponse = NextResponse.redirect(denied)
      response.cookies.getAll().forEach((c) => {
        redirectResponse.cookies.set(c.name, c.value)
      })
      return redirectResponse
    }

    if (pathname !== '/admin/forbidden' && !canAccessAdminPath(appRole, pathname)) {
      const forbidden = new URL('/admin/forbidden', request.url)
      forbidden.searchParams.set('from', pathname)
      const redirectResponse = NextResponse.redirect(forbidden)
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
