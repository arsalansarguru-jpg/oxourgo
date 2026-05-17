import { describe, expect, it } from 'vitest'

import { SAFE_USER_MESSAGE } from '@/lib/errors/safe-user-message'
import {
  inferKycContentType,
  isAllowedKycMime,
} from '@/lib/kyc/mime'
import { isKycObjectPathForUser } from '@/lib/kyc/object-path'
import {
  kycActionDbFailed,
  mapStorageErrorToKycUpload,
  sanitizeSupabaseMessageForUser,
} from '@/lib/kyc/upload-errors'

describe('kyc upload errors', () => {
  it('maps RLS failures to unauthorized', () => {
    const res = kycActionDbFailed('test', {
      message: 'permission denied',
      code: '42501',
      details: '',
      hint: '',
      name: 'PostgrestError',
    })
    expect(res.message).toBe(SAFE_USER_MESSAGE.unauthorized)
  })

  it('maps PGRST116 to a refresh hint', () => {
    const res = kycActionDbFailed('test', {
      message: 'Cannot coerce',
      code: 'PGRST116',
      details: '',
      hint: '',
      name: 'PostgrestError',
    })
    expect(res.message).toContain('Refresh')
  })

  it('maps storage 403 to forbidden upload copy', () => {
    const err = mapStorageErrorToKycUpload({
      message: 'new row violates row-level security policy',
      name: 'StorageError',
      statusCode: '403',
    })
    expect(err.code).toBe('forbidden')
  })

  it('maps mime rejection to invalid_file with server message', () => {
    const err = mapStorageErrorToKycUpload({
      message: 'mime type application/octet-stream is not supported',
      name: 'StorageError',
      statusCode: '400',
    })
    expect(err.code).toBe('invalid_file')
    expect(err.message).toContain('mime type')
  })

  it('sanitizes unsafe postgres messages', () => {
    expect(sanitizeSupabaseMessageForUser('relation "kyc_documents" does not exist')).toBeNull()
    expect(sanitizeSupabaseMessageForUser('File size limit exceeded')).toBe('File size limit exceeded')
  })
})

describe('kyc mime and path', () => {
  it('infers jpeg from extension when file.type is empty (mobile)', () => {
    const file = new File([new Uint8Array([1, 2, 3])], 'license-scan.JPG', { type: '' })
    expect(inferKycContentType(file)).toBe('image/jpeg')
    expect(isAllowedKycMime(inferKycContentType(file), false)).toBe(true)
  })

  it('allows pdf for ID tiles', () => {
    expect(isAllowedKycMime('application/pdf', false)).toBe(true)
  })

  it('validates storage path prefix', () => {
    const uid = '11111111-1111-1111-1111-111111111111'
    expect(isKycObjectPathForUser(`${uid}/license-1.jpg`, uid)).toBe(true)
    expect(isKycObjectPathForUser('other-user/license-1.jpg', uid)).toBe(false)
  })
})
