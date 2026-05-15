import 'server-only'

import { checkWhatsAppVehicleAvailability } from '@/lib/whatsapp/operations/availability'
import { createAdminClient } from '@/lib/supabase/admin'
import { logPostgrestError } from '@/lib/errors/safe-user-message'

export type SuggestedVehicle = {
  id: string
  name: string
  brand: string
  pricePerDay: number
  available: boolean
  unavailableReason?: string
}

/** Suggest catalog vehicles available for the requested window (database overlap only). */
export async function suggestVehiclesForWhatsAppWindow(input: {
  pickupAtIso: string
  returnAtIso: string
  city?: string | null
  limit?: number
}): Promise<{ vehicles: SuggestedVehicle[]; error: string | null }> {
  const admin = createAdminClient()
  const limit = Math.min(Math.max(input.limit ?? 5, 1), 12)

  let q = admin
    .from('vehicles')
    .select('id,name,brand,price_per_day,available,city')
    .eq('available', true)
    .order('price_per_day', { ascending: true })
    .limit(limit * 2)

  if (input.city?.trim()) {
    q = q.ilike('city', input.city.trim())
  }

  const { data: rows, error } = await q

  if (error) {
    logPostgrestError('[suggestVehiclesForWhatsAppWindow]', error)
    return { vehicles: [], error: 'Could not load fleet.' }
  }

  const suggestions: SuggestedVehicle[] = []

  for (const v of rows ?? []) {
    if (suggestions.length >= limit) break

    const avail = await checkWhatsAppVehicleAvailability({
      vehicleId: v.id,
      pickupAtIso: input.pickupAtIso,
      returnAtIso: input.returnAtIso,
    })

    const price = typeof v.price_per_day === 'number' ? v.price_per_day : Number(v.price_per_day) || 0

    suggestions.push({
      id: v.id,
      name: v.name?.trim() || 'Vehicle',
      brand: v.brand?.trim() || '',
      pricePerDay: price,
      available: avail.ok && avail.available,
      unavailableReason: avail.ok && !avail.available ? avail.reason : undefined,
    })
  }

  const availableFirst = [...suggestions].sort((a, b) => {
    if (a.available === b.available) return a.pricePerDay - b.pricePerDay
    return a.available ? -1 : 1
  })

  return { vehicles: availableFirst.slice(0, limit), error: null }
}
