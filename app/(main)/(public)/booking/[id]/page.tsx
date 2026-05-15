import { redirect } from 'next/navigation'

import { getVehicleInquiryWhatsAppUrl } from '@/lib/business-contact'
import { getFleetCarById } from '@/lib/fleet/get-fleet-car-by-id'

export const dynamic = 'force-dynamic'

/** Online booking is paused — send guests to WhatsApp concierge with optional trip hints from query string. */
export default async function BookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ from?: string; to?: string; pickup?: string }>
}) {
  const { id } = await params
  const sp = await searchParams
  const car = await getFleetCarById(id)
  redirect(
    getVehicleInquiryWhatsAppUrl({
      vehicleName: car?.name ?? undefined,
      tripFrom: sp.from ?? undefined,
      tripTo: sp.to ?? undefined,
      pickupHub: sp.pickup ?? undefined,
    }),
  )
}
