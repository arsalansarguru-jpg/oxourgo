import { NextResponse, type NextRequest } from 'next/server'

import { validateTripWindow } from '@/lib/booking/dates'
import { hasVehicleBookingOverlap } from '@/lib/booking/vehicle-overlap'
import { logFleetVehiclesError } from '@/lib/fleet/public-vehicle-catalog'
import { isVehicleAvailableForBooking, type VehicleRow } from '@/lib/fleet/vehicle-mappers'
import { createPublicServerSupabaseClient } from '@/lib/supabase/public-server-client'

/** Query param is vehicle UUID (`carId` kept for clients; `vehicleId` alias supported). */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const inventoryId = searchParams.get('vehicleId') ?? searchParams.get('carId')
  const pickup = searchParams.get('pickup')
  const ret = searchParams.get('return')

  if (!inventoryId || !pickup || !ret) {
    return NextResponse.json({ ok: false, error: 'missing_params' }, { status: 400 })
  }

  const dates = validateTripWindow(pickup, ret)
  if (!dates.ok) {
    return NextResponse.json({ ok: true, available: false, reason: dates.message })
  }

  try {
    const supabase = createPublicServerSupabaseClient()

    const { data: rows, error: vErr } = await supabase
      .from('vehicles')
      .select('id,available')
      .eq('id', inventoryId)
      .limit(1)

    if (vErr) {
      logFleetVehiclesError('api/availability.vehicles', vErr)
      return NextResponse.json(
        { ok: false, error: 'vehicle_lookup_failed', hint: vErr.message },
        { status: 503 },
      )
    }

    const vehicle = rows?.[0]
    if (!vehicle) {
      return NextResponse.json(
        { ok: false, error: 'vehicle_not_found', hint: 'No row in public.vehicles for this id.' },
        { status: 404 },
      )
    }

    if (!isVehicleAvailableForBooking(vehicle as VehicleRow)) {
      return NextResponse.json({
        ok: true,
        available: false,
        reason: 'This vehicle is marked unavailable.',
        carAvailable: false,
      })
    }

    const { overlap: blocked, error: overlapErr } = await hasVehicleBookingOverlap(
      inventoryId,
      pickup,
      ret,
      null,
      supabase,
    )

    if (overlapErr) {
      return NextResponse.json(
        {
          ok: false,
          error: overlapErr,
          hint: overlapErr.includes('has_vehicle_booking_overlap')
            ? 'Apply supabase/migrations/20260513140000_bookings_vehicle_inventory.sql in the Supabase SQL editor, or set SUPABASE_SERVICE_ROLE_KEY for server-side overlap until the RPC exists.'
            : undefined,
        },
        { status: 503 },
      )
    }
    return NextResponse.json({
      ok: true,
      available: !blocked,
      overlap: blocked,
      reason: blocked ? 'Selected window overlaps an existing reservation.' : undefined,
      carAvailable: true,
    })
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'availability_failed' },
      { status: 500 },
    )
  }
}
