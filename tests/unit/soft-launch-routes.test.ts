import { describe, expect, it } from 'vitest'

import { isSoftLaunchDisabledRoute } from '@/lib/soft-launch/disabled-routes'

describe('isSoftLaunchDisabledRoute', () => {
  it('does not block admin console routes', () => {
    expect(isSoftLaunchDisabledRoute('/admin')).toBe(false)
    expect(isSoftLaunchDisabledRoute('/admin/fleet')).toBe(false)
    expect(isSoftLaunchDisabledRoute('/admin/bookings')).toBe(false)
    expect(isSoftLaunchDisabledRoute('/admin/kyc')).toBe(false)
    expect(isSoftLaunchDisabledRoute('/admin/dashboard')).toBe(false)
  })

  it('still blocks concierge-first booking flows', () => {
    expect(isSoftLaunchDisabledRoute('/booking')).toBe(true)
    expect(isSoftLaunchDisabledRoute('/booking/abc')).toBe(true)
  })
})
