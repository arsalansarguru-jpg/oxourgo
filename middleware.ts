import { createServerClient } from '@supabase/ssr'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { getCanonicalSiteOrigin, shouldCanonicalizeOrigin } from '@/lib/auth/canonical-origin'
import { canAccessAdminPath } from '@/lib/auth/route-access'
import { resolveAppRoleWithClaims } from '@/lib/auth/resolve-session-role'
import { getBusinessWhatsAppUrl } from '@/lib/business-contact'
import { isStaffRole } from '@/lib/auth/permissions'
import { resolvePostLoginPath } from '@/lib/auth/post-login-path'
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

function isLoginPath(pathname: string): boolean {
  return pathname === '/login' || pathname.startsWith('/login/')
}

function needsRoleRouting(pathname: string): boolean {
  return needsAuthenticatedUser(pathname) || isLoginPath(pathname)
}

function copyCookies(source: NextResponse, target: NextResponse): void {
  source.cookies.getAll().forEach((c) => {
    target.cookies.set(c.name, c.value)
  })
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const requestOrigin = request.nextUrl.origin

  if (shouldCanonicalizeOrigin(requestOrigin)) {
    const canonical = getCanonicalSiteOrigin(requestOrigin)
    const target = new URL(`${pathname}${request.nextUrl.search}`, canonical)
    return NextResponse.redirect(target, 308)
  }

  // Staff admin console must never be sent to WhatsApp (soft-launch blocks booking/kyc only).
  if (!pathname.startsWith('/admin') && isSoftLaunchDisabledRoute(pathname)) {
    const message = softLaunchInquiryMessageForPath(pathname)
    return NextResponse.redirect(getBusinessWhatsAppUrl(message))
  }

  const response = await updateSession(request)

  if (!needsRoleRouting(pathname)) {
    return response
  }

  const pair = getSupabasePublicEnv()
  if (!pair) {
    if (!needsAuthenticatedUser(pathname)) {
      return response
    }
    const maintenance = new URL(CONFIG_UNAVAILABLE_PATH, request.url)
    const redirectResponse = NextResponse.redirect(maintenance)
    copyCookies(response, redirectResponse)
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
    if (!needsAuthenticatedUser(pathname)) {
      return response
    }
    const siteOrigin = getCanonicalSiteOrigin(requestOrigin)
    const login = new URL('/login', siteOrigin)
    login.searchParams.set('redirect', `${request.nextUrl.pathname}${request.nextUrl.search}`)
    const redirectResponse = NextResponse.redirect(login)
    copyCookies(response, redirectResponse)
    return redirectResponse
  }

  const appRole = await resolveAppRoleWithClaims(supabase, user, `middleware:${pathname}`)

  // Already signed in: send staff to admin console (login page + post-auth default).
  if (isLoginPath(pathname) && isStaffRole(appRole)) {
    const destination = resolvePostLoginPath(
      appRole,
      request.nextUrl.searchParams.get('redirect'),
    )
    const redirectResponse = NextResponse.redirect(new URL(destination, request.url))
    copyCookies(response, redirectResponse)
    return redirectResponse
  }

  // Staff must use the admin console — never the customer dashboard.
  if (pathname.startsWith('/dashboard') && isStaffRole(appRole)) {
    const adminHome = new URL('/admin', request.url)
    const redirectResponse = NextResponse.redirect(adminHome)
    copyCookies(response, redirectResponse)
    return redirectResponse
  }

  if (pathname.startsWith('/admin')) {
    // Non-staff users stay on /admin/* and get an admin-themed "no access" view
    // rendered by the admin layout. We intentionally do NOT redirect them to
    // the customer dashboard so /admin never visually leaks customer chrome.
    if (!isStaffRole(appRole)) {
      return response
    }

    if (pathname !== '/admin/forbidden' && !canAccessAdminPath(appRole, pathname)) {
      const forbidden = new URL('/admin/forbidden', request.url)
      forbidden.searchParams.set('from', pathname)
      const redirectResponse = NextResponse.redirect(forbidden)
      copyCookies(response, redirectResponse)
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
