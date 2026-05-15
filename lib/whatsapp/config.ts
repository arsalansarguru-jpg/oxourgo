/** Server-only WhatsApp Cloud API configuration (future send/receive). */
export function whatsAppApiBaseUrl(): string {
  const v = process.env.WHATSAPP_API_VERSION?.trim()
  return v ? `https://graph.facebook.com/${v}` : 'https://graph.facebook.com/v21.0'
}

export function whatsAppAccessToken(): string | null {
  return process.env.WHATSAPP_ACCESS_TOKEN?.trim() || null
}

export function whatsAppPhoneNumberId(): string | null {
  return process.env.WHATSAPP_PHONE_NUMBER_ID?.trim() || null
}
