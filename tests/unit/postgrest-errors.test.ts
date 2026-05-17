import { describe, expect, it } from 'vitest'

import {
  isMissingColumnError,
  isMissingRelationError,
  isSchemaMismatchError,
} from '@/lib/supabase/postgrest-errors'

describe('postgrest-errors', () => {
  it('detects missing relation from code and message', () => {
    expect(isMissingRelationError({ message: 'relation "public.kyc_documents" does not exist', code: '42P01' } as never)).toBe(
      true,
    )
    expect(isMissingRelationError({ message: 'Could not find the table', code: 'PGRST205' } as never)).toBe(true)
  })

  it('detects missing column errors', () => {
    expect(isMissingColumnError({ message: 'column profiles.kyc_status does not exist', code: '42703' } as never)).toBe(
      true,
    )
    expect(isMissingColumnError({ message: 'column not found', code: 'PGRST204' } as never)).toBe(true)
  })

  it('groups schema mismatch helpers', () => {
    const err = { message: 'relation "kyc_documents" does not exist', code: '42P01' } as never
    expect(isSchemaMismatchError(err)).toBe(true)
    expect(isMissingColumnError(err)).toBe(false)
  })
})
