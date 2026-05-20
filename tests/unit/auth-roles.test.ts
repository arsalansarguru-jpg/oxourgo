import { describe, expect, it } from 'vitest'

import { isStaffRole } from '@/lib/auth/permissions'
import {
  collectAppRolesFromMetadata,
  isAdminPortalRole,
  parseAppAuthRole,
  pickHighestAppRole,
  resolveAuthRoleFromMetadata,
} from '@/lib/auth/roles'

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

  it('resolves Supabase user with role admin and oxour_role ops_admin', () => {
    expect(
      resolveAuthRoleFromMetadata({ role: 'admin', oxour_role: 'ops_admin' }, {}),
    ).toBe('ops_admin')
    expect(isAdminPortalRole('ops_admin')).toBe(true)
    expect(isStaffRole('ops_admin')).toBe(true)
  })

  it('ignores Supabase JWT auth role strings in metadata', () => {
    expect(resolveAuthRoleFromMetadata({ role: 'authenticated' }, {})).toBe('customer')
  })

  it('picks highest role when metadata buckets disagree', () => {
    expect(
      pickHighestAppRole(collectAppRolesFromMetadata({ oxour_role: 'customer', role: 'admin' }, {})),
    ).toBe('ops_admin')
  })

  it('reads user_metadata.role when app_metadata is empty', () => {
    expect(resolveAuthRoleFromMetadata({}, { role: 'ops_admin' })).toBe('ops_admin')
  })
})
