/**
 * @deprecated Import from `@/lib/business-contact` instead.
 * Re-exports for legacy imports only.
 */
export {
  getBusinessContact,
  getBusinessPhoneDisplay,
  getBusinessPhoneE164Digits,
  getBusinessPhoneTel,
  getBusinessSupportEmail,
  getBusinessWhatsAppE164Digits,
  getBusinessWhatsAppUrl,
  BUSINESS_PHONE_E164_DIGITS,
  BUSINESS_SUPPORT_EMAIL,
  BUSINESS_WHATSAPP_E164_DIGITS,
} from '@/lib/business-contact'

import {
  getBusinessPhoneDisplay,
  getBusinessPhoneTel,
  getBusinessSupportEmail,
  getBusinessWhatsAppUrl,
} from '@/lib/business-contact'

/** @deprecated Use `getBusinessSupportEmail()` */
export const BUSINESS_EMAIL_PRIMARY = getBusinessSupportEmail()

/** @deprecated Use `getBusinessPhoneDisplay()` */
export const BUSINESS_PHONE_DISPLAY = getBusinessPhoneDisplay()

/** @deprecated Use `getBusinessPhoneTel()` */
export const BUSINESS_PHONE_TEL = getBusinessPhoneTel()

/** @deprecated Use `getBusinessWhatsAppUrl()` */
export const BUSINESS_WHATSAPP_URL = getBusinessWhatsAppUrl()
