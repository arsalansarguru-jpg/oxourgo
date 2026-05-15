import {
  BUSINESS_EMAIL_PRIMARY,
  BUSINESS_PHONE_DISPLAY,
  BUSINESS_PHONE_TEL,
  BUSINESS_WHATSAPP_URL,
} from '@/lib/constants'

export const BRAND = {
  name: 'Oxour Go',
  tagline: 'Luxury Self-Drive',
  logoSrc: '/brand/oxour-go-mark.svg',
  logoAlt:
    'Oxour Go logo: glowing neon blue OG monogram with OXOUR GO wordmark on a dark background',
  phoneDisplay: BUSINESS_PHONE_DISPLAY,
  phoneTel: BUSINESS_PHONE_TEL,
  email: BUSINESS_EMAIL_PRIMARY,
  address: 'Mumbai, Maharashtra, India',
  whatsapp: BUSINESS_WHATSAPP_URL,
} as const

export const PICKUP_LOCATIONS = ['Andheri', 'Bandra', 'Colaba', 'Juhu', 'Powai'] as const
