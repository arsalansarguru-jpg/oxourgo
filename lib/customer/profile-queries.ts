import 'server-only'

import { logPostgrestError } from '@/lib/errors/safe-user-message'
import { isMissingColumnError, isMissingRelationError } from '@/lib/supabase/postgrest-errors'
import { createClient } from '@/lib/supabase/server'

export type CustomerProfileSnapshot = {
  full_name: string | null
  display_name: string | null
  phone: string | null
  avatar_url: string | null
  verification_tier: string
  kyc_status: string
  kyc_submitted_at: string | null
  kyc_approved_at: string | null
}

export const DEFAULT_CUSTOMER_PROFILE: CustomerProfileSnapshot = {
  full_name: null,
  display_name: null,
  phone: null,
  avatar_url: null,
  verification_tier: 'basic',
  kyc_status: 'not_started',
  kyc_submitted_at: null,
  kyc_approved_at: null,
}

const PROFILE_KYC_SELECT =
  'full_name, display_name, phone, avatar_url, verification_tier, kyc_status, kyc_submitted_at, kyc_approved_at' as const

const PROFILE_MINIMAL_SELECT = 'full_name, display_name, phone, avatar_url, verification_tier' as const

type ProfileRow = Partial<Record<keyof CustomerProfileSnapshot, string | null>>

function snapshotFromRow(row: ProfileRow | null): CustomerProfileSnapshot {
  if (!row) return DEFAULT_CUSTOMER_PROFILE
  return {
    full_name: row.full_name ?? null,
    display_name: row.display_name ?? null,
    phone: row.phone ?? null,
    avatar_url: row.avatar_url ?? null,
    verification_tier: (row.verification_tier ?? 'basic').trim() || 'basic',
    kyc_status: (row.kyc_status ?? 'not_started').trim() || 'not_started',
    kyc_submitted_at: row.kyc_submitted_at ?? null,
    kyc_approved_at: row.kyc_approved_at ?? null,
  }
}

/**
 * Loads the signed-in customer's profile with safe fallbacks when KYC columns
 * or the profiles table are missing in production.
 */
export async function getCustomerProfileSnapshot(userId: string): Promise<CustomerProfileSnapshot> {
  const supabase = await createClient()

  let { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_KYC_SELECT)
    .eq('user_id', userId)
    .maybeSingle()

  if (error && isMissingColumnError(error)) {
    ;({ data, error } = await supabase
      .from('profiles')
      .select(PROFILE_MINIMAL_SELECT)
      .eq('user_id', userId)
      .maybeSingle())
  }

  if (error) {
    if (isMissingRelationError(error) || isMissingColumnError(error)) {
      logPostgrestError('[getCustomerProfileSnapshot]', error)
      return DEFAULT_CUSTOMER_PROFILE
    }
    logPostgrestError('[getCustomerProfileSnapshot]', error)
    return DEFAULT_CUSTOMER_PROFILE
  }

  return snapshotFromRow((data ?? null) as ProfileRow | null)
}
