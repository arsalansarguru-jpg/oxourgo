/**
 * Outbound communications — enqueue via `enqueueOutboundEmail` in `./outbound-enqueue`.
 * Reserved for future channels (WhatsApp API, SMS).
 */
export type OutboundChannel = 'email' | 'whatsapp'

export {
  enqueueOutboundEmail,
  getEmailFromAddress,
  parseOpsAlertEmails,
  type OutboundJobInsert,
} from '@/lib/notifications/channels/outbound-enqueue'
