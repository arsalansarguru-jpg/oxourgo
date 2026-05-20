import { describe, expect, it } from 'vitest'

import { defaultPostLoginPath, resolvePostLoginPath } from '@/lib/auth/post-login-path'

describe('resolvePostLoginPath', () => {
  it('sends ops_admin to /admin by default', () => {
    expect(defaultPostLoginPath('ops_admin')).toBe('/admin')
    expect(resolvePostLoginPath('ops_admin', null)).toBe('/admin')
  })

  it('rewrites staff away from customer dashboard', () => {
    expect(resolvePostLoginPath('ops_admin', '/dashboard')).toBe('/admin')
    expect(resolvePostLoginPath('ops_admin', '/dashboard/bookings')).toBe('/admin')
  })

  it('keeps staff deep links under /admin', () => {
    expect(resolvePostLoginPath('ops_admin', '/admin/fleet')).toBe('/admin/fleet')
  })

  it('sends customers to /dashboard and blocks /admin', () => {
    expect(defaultPostLoginPath('customer')).toBe('/dashboard')
    expect(resolvePostLoginPath('customer', '/admin')).toBe('/dashboard')
    expect(resolvePostLoginPath('customer', '/admin/kyc')).toBe('/dashboard')
  })
})
