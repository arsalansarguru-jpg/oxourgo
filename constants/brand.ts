import { getBusinessContact } from '@/lib/business-contact'

const contact = getBusinessContact()

export const BRAND = {
  name: 'Oxour Go',
  tagline: 'Self-Drive Car Rental',
  /** Full lockup (OG monogram + OXOUR GO wordmark). */
  logoSrc: '/brand/oxour-go-logo.png',
  /** Compact mark for very small surfaces (favicon-style). */
  logoMarkSrc: '/brand/oxour-go-mark.svg',
  logoAlt: 'Oxour Go — OG monogram and OXOUR GO wordmark',
  phoneDisplay: contact.phoneDisplay,
  phoneTel: contact.phoneTel,
  email: contact.supportEmail,
  address: 'Mumbai, Maharashtra, India',
  whatsapp: contact.whatsappUrl,
} as const

export const PICKUP_LOCATIONS = ['Andheri', 'Bandra', 'Colaba', 'Juhu', 'Powai'] as const
