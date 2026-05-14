/**
 * Whether the customer may book a vehicle (server + client gate).
 * Prefer `kyc_status === 'approved'`; fall back to legacy `verification_tier === 'verified'`.
 */
export function isProfileKycApprovedForBooking(
  profile: { verification_tier?: string | null; kyc_status?: string | null } | null | undefined,
): boolean {
  if (!profile) return false
  if (profile.kyc_status === 'approved') return true
  const tier = (profile.verification_tier ?? '').trim()
  const ks = profile.kyc_status
  if ((ks == null || ks === '') && tier === 'verified') return true
  return false
}
