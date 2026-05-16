import { describe, expect, it, beforeEach, afterEach } from 'vitest'

import { getCanonicalSiteOrigin, shouldCanonicalizeOrigin } from '@/lib/auth/canonical-origin'

describe('canonical-origin', () => {
  const prevSiteUrl = process.env.NEXT_PUBLIC_SITE_URL
  const prevNodeEnv = process.env.NODE_ENV

  afterEach(() => {
    if (prevSiteUrl === undefined) delete process.env.NEXT_PUBLIC_SITE_URL
    else process.env.NEXT_PUBLIC_SITE_URL = prevSiteUrl
    process.env.NODE_ENV = prevNodeEnv
  })

  it('rewrites supabase project hosts to the configured site', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://www.oxourgo.com'
    const supabaseHost = 'https://abcdefgh.supabase.co'
    expect(shouldCanonicalizeOrigin(supabaseHost)).toBe(true)
    expect(getCanonicalSiteOrigin(supabaseHost)).toBe('https://www.oxourgo.com')
  })

  it('keeps localhost for local development', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://www.oxourgo.com'
    expect(shouldCanonicalizeOrigin('http://localhost:3000')).toBe(false)
    expect(getCanonicalSiteOrigin('http://localhost:3000')).toBe('http://localhost:3000')
  })

  it('does not rewrite when already on the canonical host', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://www.oxourgo.com'
    expect(shouldCanonicalizeOrigin('https://www.oxourgo.com')).toBe(false)
    expect(getCanonicalSiteOrigin('https://www.oxourgo.com')).toBe('https://www.oxourgo.com')
  })

  beforeEach(() => {
    process.env.NODE_ENV = 'production'
  })
})
