import { describe, expect, it } from 'vitest'

import { isStaffRole } from '@/lib/auth/permissions'
import { parseAppAuthRole, resolveAuthRoleFromMetadata } from '@/lib/auth/roles'

describe('resolveAuthRoleFromMetadata', () => {
  it('maps legacy admin string to ops_admin', () => {
    expect(parseAppAuthRole('admin')).toBe('ops_admin')
    expect(parseAppAuthRole('ADMIN')).toBe('ops_admin')
    expect(isStaffRole(parseAppAuthRole('admin')!)).toBe(true)
  })

  it('reads oxour_role from app_metadata first', () => {
    expect(
      resolveAuthRoleFromMetadata({ oxour_role: 'ops_admin' }, { oxour_role: 'customer' }),
    ).toBe('ops_admin')
  })

  it('falls back to user_metadata when app_metadata is empty', () => {
    expect(resolveAuthRoleFromMetadata({}, { role: 'admin' })).toBe('ops_admin')
  })

  it('defaults to customer when no role is set', () => {
    expect(resolveAuthRoleFromMetadata({}, {})).toBe('customer')
  })
})
