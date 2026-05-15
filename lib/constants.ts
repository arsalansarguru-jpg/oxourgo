import {
  getBusinessPhoneDisplay,
  getBusinessPhoneTel,
  getBusinessWhatsAppUrl,
} from '@/lib/business-contact'

export const BUSINESS_EMAIL_PRIMARY = 'hello@oxourgo.com'

export const BUSINESS_PHONE_DISPLAY = getBusinessPhoneDisplay()
export const BUSINESS_PHONE_TEL = getBusinessPhoneTel()
export const BUSINESS_WHATSAPP_URL = getBusinessWhatsAppUrl()
