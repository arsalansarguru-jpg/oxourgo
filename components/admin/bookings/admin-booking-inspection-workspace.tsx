'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react'

import type { AdminInspectionBundle } from '@/lib/admin/data/booking-inspection'
import {
  adminSavePickupInspectionAction,
  adminSaveReturnInspectionAction,
  adminUploadBookingInspectionPhotoAction,
  adminUploadHandoverSignatureAction,
} from '@/lib/admin/actions/booking-inspection-actions'
import { adminSaveBookingChecklistsAction } from '@/lib/admin/actions/booking-actions'
import {
  INSPECTION_PHOTO_SLOTS,
  parseConditionNotes,
  PICKUP_INSPECTION_CHECKLIST_KEYS,
  RETURN_INSPECTION_CHECKLIST_KEYS,
  type ConditionNotesShape,
} from '@/lib/booking/inspection'
import type { BookingInspectionEventRow } from '@/lib/admin/data/booking-inspection'
import type { BookingWithCar } from '@/lib/supabase/database.types'
import { formatInr } from '@/lib/format'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { AdminCard, AdminCardContent } from '@/components/admin/admin-card'

const TABS = ['pickup', 'return', 'penalties', 'timeline'] as const
type TabId = (typeof TABS)[number]

const PICKUP_LABELS: Record<(typeof PICKUP_INSPECTION_CHECKLIST_KEYS)[number], string> = {
  kyc_verified: 'KYC verified',
  payment_received: 'Rental payment received',
  driving_license_checked: 'Driving licence checked',
  fuel_level_recorded: 'Fuel level recorded',
  odometer_recorded: 'Odometer reading recorded',
}

const RETURN_LABELS: Record<(typeof RETURN_INSPECTION_CHECKLIST_KEYS)[number], string> = {
  fuel_checked: 'Fuel checked',
  damages_checked: 'Damages checked',
  cleanliness_checked: 'Cleanliness checked',
  odometer_checked: 'Odometer checked',
  keys_returned: 'Keys & accessories returned',
}

const SLOT_LABELS: Record<(typeof INSPECTION_PHOTO_SLOTS)[number], string> = {
  front: 'Front',
  rear: 'Rear',
  left: 'Left side',
  right: 'Right side',
  interior: 'Interior',
}

function readChecklist(map: unknown): Record<string, boolean> {
  if (!map || typeof map !== 'object' || Array.isArray(map)) return {}
  const out: Record<string, boolean> = {}
  for (const [k, v] of Object.entries(map as Record<string, unknown>)) {
    out[k] = Boolean(v)
  }
  return out
}

function SignaturePad({
  disabled,
  onClear,
  canvasRef,
}: {
  disabled: boolean
  onClear: () => void
  canvasRef: React.RefObject<HTMLCanvasElement | null>
}) {
  const drawing = useRef(false)
  const last = useRef<{ x: number; y: number } | null>(null)

  const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const c = canvasRef.current
    if (!c) return { x: 0, y: 0 }
    const r = c.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled) return
    e.currentTarget.setPointerCapture(e.pointerId)
    drawing.current = true
    last.current = pos(e)
  }

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current || disabled) return
    const c = canvasRef.current
    const ctx = c?.getContext('2d')
    if (!ctx || !c) return
    const p = pos(e)
    const prev = last.current
    last.current = p
    if (!prev) return
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.92)'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(prev.x, prev.y)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
  }

  const end = () => {
    drawing.current = false
    last.current = null
  }

  return (
    <div className="space-y-2">
      <canvas
        ref={canvasRef}
        width={400}
        height={160}
        className={cn(
          'w-full max-w-md touch-none rounded-xl border border-stroke-strong bg-white',
          disabled ? 'cursor-not-allowed opacity-60' : 'cursor-crosshair',
        )}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={end}
        onPointerLeave={end}
      />
      <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={onClear}>
        Clear signature
      </Button>
    </div>
  )
}

export function AdminBookingInspectionWorkspace({
  booking,
  inspection,
}: {
  booking: BookingWithCar
  inspection: AdminInspectionBundle
}) {
  const router = useRouter()
  const [tab, setTab] = useState<TabId>('pickup')
  const [pending, start] = useTransition()
  const [localMsg, setLocalMsg] = useState<string | null>(null)
  const sigRef = useRef<HTMLCanvasElement>(null)

  const pickupCheck = useMemo(() => readChecklist(booking.pickup_checklist), [booking.pickup_checklist])
  const returnCheck = useMemo(() => readChecklist(booking.return_checklist), [booking.return_checklist])

  const pickupNotes = useMemo(() => parseConditionNotes(booking.pickup_condition_notes), [booking.pickup_condition_notes])
  const returnNotes = useMemo(() => parseConditionNotes(booking.return_condition_notes), [booking.return_condition_notes])

  const photoByKey = useCallback(
    (phase: 'pickup' | 'return', slot: string) => inspection.photos.find((p) => p.phase === phase && p.slot === slot),
    [inspection.photos],
  )

  const run = (fn: () => Promise<{ ok: boolean; message?: string }>) => {
    setLocalMsg(null)
    start(async () => {
      const r = await fn()
      if (!r.ok) setLocalMsg(r.message ?? 'Request failed')
      router.refresh()
    })
  }

  const clearSig = () => {
    const c = sigRef.current
    const ctx = c?.getContext('2d')
    if (ctx && c) ctx.clearRect(0, 0, c.width, c.height)
  }

  useEffect(() => {
    const c = sigRef.current
    const ctx = c?.getContext('2d')
    if (ctx && c) ctx.clearRect(0, 0, c.width, c.height)
  }, [booking.customer_handover_signature_path, booking.updated_at])

  const canEditPickup = booking.booking_status === 'pending_payment' || booking.booking_status === 'confirmed'

  const penaltiesTotal =
    booking.penalty_total ??
    (booking.penalty_damage_rupees ?? 0) +
      (booking.penalty_late_rupees ?? 0) +
      (booking.penalty_extra_km_rupees ?? 0) +
      (booking.penalty_fuel_rupees ?? 0) +
      (booking.penalty_cleaning_rupees ?? 0) +
      (booking.penalty_traffic_rupees ?? 0)
  const outstandingPenalties =
    penaltiesTotal > 0 && booking.booking_status !== 'completed' && booking.booking_status !== 'cancelled'

  const eventLabel = (t: string) => {
    switch (t) {
      case 'pickup_inspection_saved':
        return 'Pickup inspection saved'
      case 'return_inspection_saved':
        return 'Return inspection saved'
      case 'photo_uploaded':
        return 'Photo uploaded'
      case 'handover_signature_saved':
        return 'Signature saved'
      case 'penalty_updated':
        return 'Penalties updated'
      default:
        return t
    }
  }

  return (
    <AdminCard>
      <AdminCardContent className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-soft">Vehicle inspection</h2>
            <p className="text-xs text-muted">Mobile-friendly pickup and return workflow, photos, and penalties.</p>
          </div>
          {outstandingPenalties ? (
            <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-200">
              Outstanding penalties
            </span>
          ) : null}
        </div>

        <div className="flex gap-1 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TABS.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cn(
                'shrink-0 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-colors',
                tab === id ? 'bg-electric text-white' : 'bg-matte/[0.4] text-muted hover:text-soft',
              )}
            >
              {id}
            </button>
          ))}
        </div>

        {tab === 'pickup' ? (
          <div className="space-y-6">
            <div className="rounded-xl border border-stroke bg-matte/[0.35] p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">Pickup checklist</p>
              <ul className="space-y-2">
                {PICKUP_INSPECTION_CHECKLIST_KEYS.map((key) => (
                  <li key={key} className="flex items-center gap-2">
                    <input
                      id={`insp-pick-${key}`}
                      type="checkbox"
                      className="h-4 w-4 rounded border-stroke-strong"
                      defaultChecked={pickupCheck[key] === true}
                      disabled={pending || !canEditPickup}
                      onChange={(e) => {
                        run(async () =>
                          adminSaveBookingChecklistsAction({
                            bookingId: booking.id,
                            pickup: { [key]: e.target.checked },
                          }),
                        )
                      }}
                    />
                    <label htmlFor={`insp-pick-${key}`} className="text-sm text-soft">
                      {PICKUP_LABELS[key]}
                    </label>
                  </li>
                ))}
              </ul>
            </div>

            <form
              className="grid gap-4 sm:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault()
                const fd = new FormData(e.currentTarget)
                const fuel = fd.get('pickup_fuel')?.toString().trim()
                const odo = fd.get('pickup_odo')?.toString().trim()
                const markDone = fd.get('mark_pickup_done') === 'on'
                const notes: ConditionNotesShape = {
                  scratches: String(fd.get('pn_scratches') ?? ''),
                  dents: String(fd.get('pn_dents') ?? ''),
                  fuelNote: String(fd.get('pn_fuel') ?? ''),
                  cleanliness: String(fd.get('pn_clean') ?? ''),
                }
                run(async () =>
                  adminSavePickupInspectionAction({
                    bookingId: booking.id,
                    pickupFuelLevel: fuel === '' ? null : Number(fuel),
                    pickupOdometerKm: odo === '' ? null : Number(odo),
                    notes,
                    markCompleted: markDone,
                  }),
                )
              }}
            >
              <Input
                name="pickup_fuel"
                type="number"
                min={0}
                max={100}
                label="Fuel at pickup (%)"
                defaultValue={booking.pickup_fuel_level ?? ''}
                disabled={pending || !canEditPickup}
                className="min-h-10"
              />
              <Input
                name="pickup_odo"
                type="number"
                min={0}
                label="Odometer at pickup (km)"
                defaultValue={booking.pickup_odometer_km ?? ''}
                disabled={pending || !canEditPickup}
                className="min-h-10"
              />
              <div className="sm:col-span-2 grid gap-3 sm:grid-cols-2">
                <Input name="pn_scratches" label="Scratches / marks" defaultValue={pickupNotes.scratches ?? ''} className="min-h-10" />
                <Input name="pn_dents" label="Dents" defaultValue={pickupNotes.dents ?? ''} className="min-h-10" />
                <Input name="pn_fuel" label="Fuel notes" defaultValue={pickupNotes.fuelNote ?? ''} className="min-h-10" />
                <Input name="pn_clean" label="Cleanliness" defaultValue={pickupNotes.cleanliness ?? ''} className="min-h-10" />
              </div>
              <label className="flex items-center gap-2 text-sm text-soft sm:col-span-2">
                <input type="checkbox" name="mark_pickup_done" defaultChecked={Boolean(booking.pickup_inspection_completed_at)} />
                Mark pickup inspection record as completed (timestamp)
              </label>
              <div className="sm:col-span-2">
                <Button
                  type="submit"
                  variant="secondary"
                  disabled={pending || !canEditPickup}
                >
                  Save pickup readings &amp; notes
                </Button>
              </div>
            </form>

            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Pickup photos</p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {INSPECTION_PHOTO_SLOTS.map((slot) => {
                  const row = photoByKey('pickup', slot)
                  const url = row ? inspection.photoSignedUrls[row.id] : undefined
                  return (
                    <div key={slot} className="space-y-2 rounded-xl border border-stroke p-3">
                      <p className="text-sm font-medium text-soft">{SLOT_LABELS[slot]}</p>
                      {url ? (
                        <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-stroke bg-black/20">
                          <Image src={url} alt={slot} fill className="object-cover" unoptimized />
                        </div>
                      ) : (
                        <p className="text-xs text-muted">No photo</p>
                      )}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="max-w-full text-xs text-muted file:mr-2 file:rounded-lg file:border-0 file:bg-electric/20 file:px-2 file:py-1 file:text-xs file:font-medium file:text-electric"
                        disabled={pending || !canEditPickup}
                        onChange={(e) => {
                          const f = e.target.files?.[0]
                          if (!f) return
                          const fd = new FormData()
                          fd.set('bookingId', booking.id)
                          fd.set('phase', 'pickup')
                          fd.set('slot', slot)
                          fd.set('file', f)
                          run(async () => {
                            const r = await adminUploadBookingInspectionPhotoAction(fd)
                            e.target.value = ''
                            return r
                          })
                        }}
                      />
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="space-y-3 rounded-xl border border-stroke bg-matte/[0.25] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Customer signature</p>
              {inspection.signatureSignedUrl ? (
                <div className="relative h-40 w-full max-w-md overflow-hidden rounded-xl border border-stroke bg-white">
                  <Image src={inspection.signatureSignedUrl} alt="Signature" fill className="object-contain p-2" unoptimized />
                </div>
              ) : (
                <SignaturePad disabled={pending || !canEditPickup} onClear={clearSig} canvasRef={sigRef} />
              )}
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={pending || !canEditPickup || Boolean(booking.customer_handover_signature_path)}
                onClick={() => {
                  const c = sigRef.current
                  if (!c) return
                  c.toBlob((blob) => {
                    if (!blob) {
                      setLocalMsg('Could not read signature from canvas.')
                      return
                    }
                    const fd = new FormData()
                    fd.set('bookingId', booking.id)
                    fd.set('file', blob, 'signature.png')
                    run(async () => adminUploadHandoverSignatureAction(fd))
                  }, 'image/png')
                }}
              >
                Upload signature
              </Button>
            </div>
          </div>
        ) : null}

        {tab === 'return' ? (
          <div className="space-y-6">
            <div className="rounded-xl border border-stroke bg-matte/[0.35] p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">Return checklist</p>
              <ul className="space-y-2">
                {RETURN_INSPECTION_CHECKLIST_KEYS.map((key) => (
                  <li key={key} className="flex items-center gap-2">
                    <input
                      id={`insp-ret-${key}`}
                      type="checkbox"
                      className="h-4 w-4 rounded border-stroke-strong"
                      defaultChecked={returnCheck[key] === true}
                      disabled={pending || booking.booking_status !== 'active' || Boolean(booking.returned_at)}
                      onChange={(e) => {
                        run(async () =>
                          adminSaveBookingChecklistsAction({
                            bookingId: booking.id,
                            return: { [key]: e.target.checked },
                          }),
                        )
                      }}
                    />
                    <label htmlFor={`insp-ret-${key}`} className="text-sm text-soft">
                      {RETURN_LABELS[key]}
                    </label>
                  </li>
                ))}
              </ul>
            </div>

            <form
              className="grid gap-4 sm:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault()
                const fd = new FormData(e.currentTarget)
                const fuel = fd.get('return_fuel')?.toString().trim()
                const odo = fd.get('return_odo')?.toString().trim()
                const markDone = fd.get('mark_return_done') === 'on'
                const notes: ConditionNotesShape = {
                  scratches: String(fd.get('rn_scratches') ?? ''),
                  dents: String(fd.get('rn_dents') ?? ''),
                  fuelNote: String(fd.get('rn_fuel') ?? ''),
                  cleanliness: String(fd.get('rn_clean') ?? ''),
                }
                run(async () =>
                  adminSaveReturnInspectionAction({
                    bookingId: booking.id,
                    returnFuelLevel: fuel === '' ? null : Number(fuel),
                    returnOdometerKm: odo === '' ? null : Number(odo),
                    notes,
                    markCompleted: markDone,
                  }),
                )
              }}
            >
              <Input
                name="return_fuel"
                type="number"
                min={0}
                max={100}
                label="Fuel at return (%)"
                defaultValue={booking.return_fuel_level ?? ''}
                disabled={pending || booking.booking_status !== 'active' || Boolean(booking.returned_at)}
                className="min-h-10"
              />
              <Input
                name="return_odo"
                type="number"
                min={0}
                label="Odometer at return (km)"
                defaultValue={booking.return_odometer_km ?? ''}
                disabled={pending || booking.booking_status !== 'active' || Boolean(booking.returned_at)}
                className="min-h-10"
              />
              <div className="sm:col-span-2 grid gap-3 sm:grid-cols-2">
                <Input name="rn_scratches" label="Scratches / marks" defaultValue={returnNotes.scratches ?? ''} className="min-h-10" />
                <Input name="rn_dents" label="Dents" defaultValue={returnNotes.dents ?? ''} className="min-h-10" />
                <Input name="rn_fuel" label="Fuel notes" defaultValue={returnNotes.fuelNote ?? ''} className="min-h-10" />
                <Input name="rn_clean" label="Cleanliness" defaultValue={returnNotes.cleanliness ?? ''} className="min-h-10" />
              </div>
              <label className="flex items-center gap-2 text-sm text-soft sm:col-span-2">
                <input type="checkbox" name="mark_return_done" defaultChecked={Boolean(booking.return_inspection_completed_at)} />
                Mark return inspection record as completed (timestamp)
              </label>
              <div className="sm:col-span-2">
                <Button type="submit" variant="secondary" disabled={pending || booking.booking_status !== 'active' || Boolean(booking.returned_at)}>
                  Save return readings &amp; notes
                </Button>
              </div>
            </form>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted">Pickup vs return — condition notes</p>
                <div className="grid gap-2 text-xs sm:grid-cols-2">
                  <div className="rounded-lg border border-stroke p-3">
                    <p className="mb-2 font-semibold text-soft">Pickup</p>
                    <dl className="space-y-1 text-muted">
                      <div>
                        <dt className="text-[10px] uppercase">Scratches</dt>
                        <dd className="text-soft">{pickupNotes.scratches || '—'}</dd>
                      </div>
                      <div>
                        <dt className="text-[10px] uppercase">Dents</dt>
                        <dd className="text-soft">{pickupNotes.dents || '—'}</dd>
                      </div>
                      <div>
                        <dt className="text-[10px] uppercase">Cleanliness</dt>
                        <dd className="text-soft">{pickupNotes.cleanliness || '—'}</dd>
                      </div>
                    </dl>
                  </div>
                  <div className="rounded-lg border border-stroke p-3">
                    <p className="mb-2 font-semibold text-soft">Return</p>
                    <dl className="space-y-1 text-muted">
                      <div>
                        <dt className="text-[10px] uppercase">Scratches</dt>
                        <dd className="text-soft">{returnNotes.scratches || '—'}</dd>
                      </div>
                      <div>
                        <dt className="text-[10px] uppercase">Dents</dt>
                        <dd className="text-soft">{returnNotes.dents || '—'}</dd>
                      </div>
                      <div>
                        <dt className="text-[10px] uppercase">Cleanliness</dt>
                        <dd className="text-soft">{returnNotes.cleanliness || '—'}</dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted">Photo pairs (pickup / return)</p>
                <div className="space-y-3">
                  {INSPECTION_PHOTO_SLOTS.map((slot) => {
                    const pr = photoByKey('pickup', slot)
                    const rr = photoByKey('return', slot)
                    const pu = pr ? inspection.photoSignedUrls[pr.id] : undefined
                    const ru = rr ? inspection.photoSignedUrls[rr.id] : undefined
                    return (
                      <div key={slot} className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="mb-1 text-[10px] uppercase text-muted">Pickup · {SLOT_LABELS[slot]}</p>
                          <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-stroke bg-black/20">
                            {pu ? <Image src={pu} alt="" fill className="object-cover" unoptimized /> : null}
                          </div>
                        </div>
                        <div>
                          <p className="mb-1 text-[10px] uppercase text-muted">Return · {SLOT_LABELS[slot]}</p>
                          <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-stroke bg-black/20">
                            {ru ? <Image src={ru} alt="" fill className="object-cover" unoptimized /> : null}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Return photos</p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {INSPECTION_PHOTO_SLOTS.map((slot) => {
                  const row = photoByKey('return', slot)
                  const url = row ? inspection.photoSignedUrls[row.id] : undefined
                  return (
                    <div key={slot} className="space-y-2 rounded-xl border border-stroke p-3">
                      <p className="text-sm font-medium text-soft">{SLOT_LABELS[slot]}</p>
                      {url ? (
                        <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-stroke bg-black/20">
                          <Image src={url} alt={slot} fill className="object-cover" unoptimized />
                        </div>
                      ) : (
                        <p className="text-xs text-muted">No photo</p>
                      )}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="max-w-full text-xs text-muted file:mr-2 file:rounded-lg file:border-0 file:bg-electric/20 file:px-2 file:py-1 file:text-xs file:font-medium file:text-electric"
                        disabled={pending || booking.booking_status !== 'active' || Boolean(booking.returned_at)}
                        onChange={(e) => {
                          const f = e.target.files?.[0]
                          if (!f) return
                          const fd = new FormData()
                          fd.set('bookingId', booking.id)
                          fd.set('phase', 'return')
                          fd.set('slot', slot)
                          fd.set('file', f)
                          run(async () => {
                            const r = await adminUploadBookingInspectionPhotoAction(fd)
                            e.target.value = ''
                            return r
                          })
                        }}
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        ) : null}

        {tab === 'penalties' ? (
          <div className="max-w-lg space-y-3 text-sm text-muted">
            <p>
              Total penalties: <span className="font-semibold text-soft">{formatInr(penaltiesTotal)}</span>
              {booking.deposit_penalty_total_rupees ? (
                <>
                  {' '}
                  · Deposit applied:{' '}
                  <span className="font-semibold text-soft">{formatInr(booking.deposit_penalty_total_rupees)}</span>
                </>
              ) : null}
            </p>
            <p className="text-xs leading-relaxed">
              Use the <span className="font-medium text-soft">Financial settlement</span> panel below to edit all six
              penalty categories, mark deposit received, and process refunds. Rental payment lines are not affected.
            </p>
            <p className="text-xs">
              Deposit status:{' '}
              <span className="font-medium uppercase tracking-wide text-soft">{booking.deposit_status ?? 'pending'}</span>
            </p>
          </div>
        ) : null}

        {tab === 'timeline' ? (
          <div className="space-y-4">
            <ul className="space-y-3 text-sm">
              {booking.approved_at ? (
                <li className="flex gap-3 border-l-2 border-electric/40 pl-3">
                  <span className="shrink-0 text-xs text-muted">Approved</span>
                  <span className="text-soft">{new Date(booking.approved_at).toLocaleString()}</span>
                </li>
              ) : null}
              {booking.pickup_inspection_completed_at ? (
                <li className="flex gap-3 border-l-2 border-stroke pl-3">
                  <span className="shrink-0 text-xs text-muted">Pickup inspection</span>
                  <span className="text-soft">{new Date(booking.pickup_inspection_completed_at).toLocaleString()}</span>
                </li>
              ) : null}
              {booking.handed_over_at ? (
                <li className="flex gap-3 border-l-2 border-electric/40 pl-3">
                  <span className="shrink-0 text-xs text-muted">Handed over</span>
                  <span className="text-soft">{new Date(booking.handed_over_at).toLocaleString()}</span>
                </li>
              ) : null}
              {booking.return_inspection_completed_at ? (
                <li className="flex gap-3 border-l-2 border-stroke pl-3">
                  <span className="shrink-0 text-xs text-muted">Return inspection</span>
                  <span className="text-soft">{new Date(booking.return_inspection_completed_at).toLocaleString()}</span>
                </li>
              ) : null}
              {booking.returned_at ? (
                <li className="flex gap-3 border-l-2 border-electric/40 pl-3">
                  <span className="shrink-0 text-xs text-muted">Returned checkpoint</span>
                  <span className="text-soft">{new Date(booking.returned_at).toLocaleString()}</span>
                </li>
              ) : null}
              {booking.completed_at ? (
                <li className="flex gap-3 border-l-2 border-electric/40 pl-3">
                  <span className="shrink-0 text-xs text-muted">Completed</span>
                  <span className="text-soft">{new Date(booking.completed_at).toLocaleString()}</span>
                </li>
              ) : null}
            </ul>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Inspection events</p>
              <ul className="max-h-80 space-y-2 overflow-y-auto text-xs">
                {inspection.events.map((ev: BookingInspectionEventRow) => (
                  <li key={ev.id} className="rounded-lg border border-stroke bg-matte/[0.3] px-3 py-2">
                    <span className="font-medium text-soft">{eventLabel(ev.event_type)}</span>
                    <span className="text-muted"> · {new Date(ev.created_at).toLocaleString()}</span>
                  </li>
                ))}
                {inspection.events.length === 0 ? <li className="text-muted">No events yet.</li> : null}
              </ul>
            </div>
          </div>
        ) : null}

        {localMsg ? <p className="text-sm text-red-300">{localMsg}</p> : null}
      </AdminCardContent>
    </AdminCard>
  )
}
