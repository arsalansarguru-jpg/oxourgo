import { describe, expect, it } from 'vitest'

import { computeKycLifecycleFromDocuments } from '@/lib/kyc/compute-kyc-profile-status'

describe('computeKycLifecycleFromDocuments', () => {
  it('approves when license and aadhaar are approved without selfie upload', () => {
    const lifecycle = computeKycLifecycleFromDocuments([
      { document_type: 'license', status: 'approved', created_at: '2026-06-01T10:00:00Z' },
      { document_type: 'aadhaar', status: 'approved', created_at: '2026-06-01T10:05:00Z' },
    ])
    expect(lifecycle).toBe('approved')
  })

  it('stays pending when license is still reviewing', () => {
    const lifecycle = computeKycLifecycleFromDocuments([
      { document_type: 'license', status: 'reviewing', created_at: '2026-06-01T10:00:00Z' },
      { document_type: 'aadhaar', status: 'approved', created_at: '2026-06-01T10:05:00Z' },
    ])
    expect(lifecycle).toBe('pending')
  })
})
