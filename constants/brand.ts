import { getBusinessContact } from '@/lib/business-contact'

const contact = getBusinessContact()

export const BRAND = {
  name: 'Oxour Go',
  tagline: 'Luxury Self-Drive',
  logoSrc: '/brand/oxour-go-mark.svg',
  logoAlt:
    'Oxour Go logo: glowing neon blue OG monogram with OXOUR GO wordmark on a dark background',
  phoneDisplay: contact.phoneDisplay,
  phoneTel: contact.phoneTel,
  email: contact.supportEmail,
  address: 'Mumbai, Maharashtra, India',
  whatsapp: contact.whatsappUrl,
} as const

export const PICKUP_LOCATIONS = ['Andheri', 'Bandra', 'Colaba', 'Juhu', 'Powai'] as const
