import { describe, expect, it, beforeEach, afterEach } from 'vitest'

import {
  getAuthCallbackOrigin,
  getCanonicalSiteOrigin,
  isLocalDevOrigin,
  shouldCanonicalizeOrigin,
} from '@/lib/auth/canonical-origin'
import { getOAuthCallbackUrl } from '@/lib/auth/callback-url'

describe('canonical-origin', () => {
  const prevSiteUrl = process.env.NEXT_PUBLIC_SITE_URL
  const prevNodeEnv = process.env.NODE_ENV

  afterEach(() => {
    if (prevSiteUrl === undefined) delete process.env.NEXT_PUBLIC_SITE_URL
    else process.env.NEXT_PUBLIC_SITE_URL = prevSiteUrl
    process.env.NODE_ENV = prevNodeEnv
  })

  beforeEach(() => {
    process.env.NODE_ENV = 'production'
    process.env.NEXT_PUBLIC_SITE_URL = 'https://www.oxourgo.com'
  })

  it('rewrites supabase project hosts to the configured site', () => {
    const supabaseHost = 'https://abcdefgh.supabase.co'
    expect(shouldCanonicalizeOrigin(supabaseHost)).toBe(true)
    expect(getCanonicalSiteOrigin(supabaseHost)).toBe('https://www.oxourgo.com')
    expect(getAuthCallbackOrigin(supabaseHost)).toBe('https://www.oxourgo.com')
  })

  it('rewrites apex domain to www for OAuth callback', () => {
    expect(shouldCanonicalizeOrigin('https://oxourgo.com')).toBe(true)
    expect(getAuthCallbackOrigin('https://oxourgo.com')).toBe('https://www.oxourgo.com')
  })

  it('keeps localhost for local development', () => {
    expect(isLocalDevOrigin('http://localhost:3000')).toBe(true)
    expect(shouldCanonicalizeOrigin('http://localhost:3000')).toBe(false)
    expect(getCanonicalSiteOrigin('http://localhost:3000')).toBe('http://localhost:3000')
    expect(getAuthCallbackOrigin('http://localhost:3000')).toBe('http://localhost:3000')
  })

  it('does not rewrite when already on the canonical host', () => {
    expect(shouldCanonicalizeOrigin('https://www.oxourgo.com')).toBe(false)
    expect(getCanonicalSiteOrigin('https://www.oxourgo.com')).toBe('https://www.oxourgo.com')
  })

  it('builds production OAuth callback URL on www', () => {
    const url = getOAuthCallbackUrl('/dashboard', 'https://oxourgo.com')
    expect(url).toBe('https://www.oxourgo.com/auth/callback?next=%2Fdashboard')
  })

  it('builds local OAuth callback URL on localhost', () => {
    const url = getOAuthCallbackUrl('/fleet', 'http://localhost:3000')
    expect(url).toBe('http://localhost:3000/auth/callback?next=%2Ffleet')
  })
})
