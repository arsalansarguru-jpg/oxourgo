import { NextResponse, type NextRequest } from 'next/server'

import { validateTripWindow } from '@/lib/booking/dates'
import { logFleetVehiclesError, isVehiclePubliclyListable } from '@/lib/fleet/public-vehicle-catalog'
import type { FleetCarRow } from '@/lib/fleet/mappers'
import { isVehicleAvailableForBooking, type VehicleRow } from '@/lib/fleet/vehicle-mappers'
import { createPublicServerSupabaseClient } from '@/lib/supabase/public-server-client'

/** `carId` is inventory id: resolved against `cars` first, then `vehicles`. */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const inventoryId = searchParams.get('carId')
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

    const { data: car, error: carErr } = await supabase
      .from('cars')
      .select('availability_status')
      .eq('id', inventoryId)
      .maybeSingle()

    if (!carErr && car) {
      const status = (car as Pick<FleetCarRow, 'availability_status'>).availability_status
      if (!isVehiclePubliclyListable(status)) {
        return NextResponse.json({
          ok: true,
          available: false,
          reason: 'This vehicle is marked unavailable.',
          carAvailable: false,
        })
      }

      const { data: overlap, error: rpcErr } = await supabase.rpc('has_booking_overlap', {
        p_car_id: inventoryId,
        p_pickup: pickup,
        p_return: ret,
        p_exclude_booking_id: null,
      })

      if (rpcErr) {
        return NextResponse.json(
          {
            ok: false,
            error: rpcErr.message,
            hint:
              rpcErr.message.includes('has_booking_overlap') || rpcErr.code === '42883'
                ? 'Apply supabase/migrations/20260212120000_bookings.sql in the Supabase SQL editor.'
                : undefined,
          },
          { status: 503 },
        )
      }

      const blocked = Boolean(overlap)
      return NextResponse.json({
        ok: true,
        available: !blocked,
        overlap: blocked,
        reason: blocked ? 'Selected window overlaps an existing reservation.' : undefined,
        carAvailable: true,
      })
    }

    const { data: vehicle, error: vErr } = await supabase
      .from('vehicles')
      .select('available,availability_status')
      .eq('id', inventoryId)
      .maybeSingle()

    if (vErr || !vehicle) {
      if (vErr) logFleetVehiclesError('api/availability.vehicles', vErr)
      return NextResponse.json({ ok: false, error: 'inventory_not_found' }, { status: 404 })
    }

    if (!isVehicleAvailableForBooking(vehicle as VehicleRow)) {
      return NextResponse.json({
        ok: true,
        available: false,
        reason: 'This vehicle is marked unavailable.',
        carAvailable: false,
      })
    }

    const { data: vOverlap, error: vRpcErr } = await supabase.rpc('has_vehicle_booking_overlap', {
      p_vehicle_id: inventoryId,
      p_pickup: pickup,
      p_return: ret,
      p_exclude_booking_id: null,
    })

    if (vRpcErr) {
      return NextResponse.json(
        {
          ok: false,
          error: vRpcErr.message,
          hint:
            vRpcErr.message.includes('has_vehicle_booking_overlap') || vRpcErr.code === '42883'
              ? 'Apply supabase/migrations/20260513140000_bookings_vehicle_inventory.sql in the Supabase SQL editor.'
              : undefined,
        },
        { status: 503 },
      )
    }

    const blocked = Boolean(vOverlap)
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
