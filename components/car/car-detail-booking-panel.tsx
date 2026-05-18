'use client'

import type { Car } from '@/types/car'

import { CarDetailInquiryPanel } from '@/components/car/car-detail-inquiry-panel'

export type CarDetailBookingPanelProps = {
  car: Car
  isLoggedIn: boolean
  /** Unused — concierge flow does not gate on auth in-browser. */
  kycApproved: boolean
  kycStatus?: string | null
  tripFrom?: string
  tripTo?: string
}

/** Legacy export — renders WhatsApp concierge panel only (no web checkout). */
export function CarDetailBookingPanel({ car, tripFrom, tripTo }: CarDetailBookingPanelProps) {
  return <CarDetailInquiryPanel car={car} tripFrom={tripFrom} tripTo={tripTo} />
}
