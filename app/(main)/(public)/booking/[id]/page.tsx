import { redirect } from 'next/navigation'

import { getVehicleInquiryWhatsAppUrl } from '@/lib/business-contact'
import { getFleetCarById } from '@/lib/fleet/get-fleet-car-by-id'

export const dynamic = 'force-dynamic'

/** Online booking is paused — send guests to WhatsApp concierge. */
export default async function BookingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const car = await getFleetCarById(id)
  redirect(
    getVehicleInquiryWhatsAppUrl({
      vehicleName: car?.name ?? undefined,
    }),
  )
}
