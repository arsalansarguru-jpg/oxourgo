import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { logPostgrestError } from '@/lib/errors/safe-user-message'
import { isProfileKycApprovedForBooking } from '@/lib/kyc/kyc-booking-eligible'
import { updateWhatsAppConversationState } from '@/lib/whatsapp/conversations'

export type WhatsAppKycStatus = {
  userId: string
  kycStatus: string
  eligible: boolean
  message: string
}

export async function getWhatsAppKycStatusForUser(userId: string): Promise<WhatsAppKycStatus | null> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('profiles')
    .select('kyc_status, verification_tier')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    logPostgrestError('[getWhatsAppKycStatusForUser]', error)
    return null
  }

  const eligible = isProfileKycApprovedForBooking(data)
  const kycStatus = data?.kyc_status ?? 'not_started'

  return {
    userId,
    kycStatus,
    eligible,
    message: eligible
      ? 'KYC approved — ready to confirm booking.'
      : 'Customer must complete KYC on the website or via ops upload before handover.',
  }
}

export async function setWhatsAppConversationAwaitingKyc(conversationId: string): Promise<void> {
  await updateWhatsAppConversationState({
    conversationId,
    flowState: 'awaiting_kyc',
  })
}
