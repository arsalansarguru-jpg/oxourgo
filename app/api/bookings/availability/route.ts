import { NextResponse, type NextRequest } from 'next/server'

import { validateTripWindow } from '@/lib/booking/dates'
import { createClient } from '@/lib/supabase/server'
import type { FleetCarRow } from '@/lib/fleet/mappers'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const carId = searchParams.get('carId')
  const pickup = searchParams.get('pickup')
  const ret = searchParams.get('return')

  if (!carId || !pickup || !ret) {
    return NextResponse.json({ ok: false, error: 'missing_params' }, { status: 400 })
  }

  const dates = validateTripWindow(pickup, ret)
  if (!dates.ok) {
    return NextResponse.json({ ok: true, available: false, reason: dates.message })
  }

  try {
    const supabase = await createClient()
    const { data: car, error: carErr } = await supabase
      .from('cars')
      .select('availability_status')
      .eq('id', carId)
      .maybeSingle()

    if (carErr || !car) {
      return NextResponse.json({ ok: false, error: 'car_not_found' }, { status: 404 })
    }

    const status = (car as Pick<FleetCarRow, 'availability_status'>).availability_status
    if (status !== 'available') {
      return NextResponse.json({
        ok: true,
        available: false,
        reason: 'This vehicle is marked unavailable.',
        carAvailable: false,
      })
    }

    const { data: overlap, error: rpcErr } = await supabase.rpc('has_booking_overlap', {
      p_car_id: carId,
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
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'availability_failed' },
      { status: 500 },
    )
  }
}
