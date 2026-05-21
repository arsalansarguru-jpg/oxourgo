import { describe, expect, it } from 'vitest'

import { defaultPostLoginPath, resolvePostLoginPath } from '@/lib/auth/post-login-path'
import { ADMIN_HOME, CUSTOMER_HOME } from '@/lib/auth/routes'

describe('resolvePostLoginPath', () => {
  it('sends ops_admin to /admin/dashboard by default', () => {
    expect(defaultPostLoginPath('ops_admin')).toBe(ADMIN_HOME)
    expect(resolvePostLoginPath('ops_admin', null)).toBe(ADMIN_HOME)
  })

  it('rewrites staff away from customer dashboard', () => {
    expect(resolvePostLoginPath('ops_admin', CUSTOMER_HOME)).toBe(ADMIN_HOME)
    expect(resolvePostLoginPath('ops_admin', `${CUSTOMER_HOME}/bookings`)).toBe(ADMIN_HOME)
  })

  it('rewrites /admin root to /admin/dashboard for staff', () => {
    expect(resolvePostLoginPath('ops_admin', '/admin')).toBe(ADMIN_HOME)
  })

  it('keeps staff deep links under /admin', () => {
    expect(resolvePostLoginPath('ops_admin', '/admin/fleet')).toBe('/admin/fleet')
  })

  it('sends customers to /dashboard and blocks /admin', () => {
    expect(defaultPostLoginPath('customer')).toBe(CUSTOMER_HOME)
    expect(resolvePostLoginPath('customer', '/admin')).toBe(CUSTOMER_HOME)
    expect(resolvePostLoginPath('customer', '/admin/kyc')).toBe(CUSTOMER_HOME)
  })
})
