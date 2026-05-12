export const MUMBAI_HUBS = ['Andheri', 'Bandra', 'Colaba', 'Juhu', 'Powai'] as const

export type MumbaiHub = (typeof MUMBAI_HUBS)[number]

export const MAX_RENTAL_DAYS = 60

export const MIN_LEAD_HOURS = 2
