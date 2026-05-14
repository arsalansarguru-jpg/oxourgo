'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

import { AdminCard, AdminCardContent } from '@/components/admin/admin-card'
import { FleetVehicleFormFields } from '@/components/admin/fleet/fleet-vehicle-form-fields'
import { FleetVehicleHeroUpload } from '@/components/admin/fleet/fleet-vehicle-hero-upload'
import { adminUpdateVehicleAction } from '@/lib/admin/actions/vehicle-actions'
import type { AdminVehicleRow } from '@/lib/admin/data/fleet'
import { Button } from '@/components/ui/Button'

type Props = {
  vehicle: AdminVehicleRow
  /** Wrap in AdminCard for detail page layout. */
  shell?: 'card' | 'none'
  showHeroUploader?: boolean
  title?: string
  onSaved?: () => void
  /** When unset: toggles appear in modal (`shell="none"`) only; detail page uses `AdminVehicleOps`. */
  showListingToggles?: boolean
}

export function FleetVehicleCatalogEditForm({
  vehicle,
  shell = 'card',
  showHeroUploader = true,
  title = 'Catalog details',
  onSaved,
  showListingToggles: showListingTogglesProp,
}: Props) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const listingToggles = showListingTogglesProp ?? shell === 'none'

  const inner = (
    <>
      {shell === 'card' ? <h2 className="mb-4 text-lg font-semibold text-soft">{title}</h2> : null}
      {showHeroUploader ? (
        <div className="mb-5 rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 theme-light:border-stroke-strong theme-light:bg-white/60">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted">Media</p>
          <FleetVehicleHeroUpload vehicleId={vehicle.id} />
        </div>
      ) : null}
      <form
        key={vehicle.id}
        className="grid gap-4 sm:grid-cols-2"
        action={(formData) => {
          setError(null)
          start(async () => {
            const res = await adminUpdateVehicleAction(vehicle.id, {
              name: String(formData.get('name') ?? '').trim(),
              brand: String(formData.get('brand') ?? '').trim(),
              city: String(formData.get('city') ?? '').trim() || null,
              year: Number(formData.get('year') ?? 0),
              registration_number: String(formData.get('registration_number') ?? '').trim(),
              fuel_type: String(formData.get('fuel_type') ?? 'petrol'),
              transmission: String(formData.get('transmission') ?? 'auto'),
              seats: Number(formData.get('seats') ?? 5),
              price_per_day: Number(formData.get('price_per_day') ?? 0),
              security_deposit: Number(formData.get('security_deposit') ?? 0),
              image: String(formData.get('image') ?? '').trim() || null,
              ...(listingToggles
                ? {
                    featured: formData.get('featured') === 'on',
                    available: formData.get('available') === 'on',
                  }
                : {
                    featured: vehicle.featured,
                    available: vehicle.available !== false,
                  }),
            })
            if (!res.ok) {
              setError(res.message)
              return
            }
            router.refresh()
            onSaved?.()
          })
        }}
      >
        <FleetVehicleFormFields
          defaults={{
            name: vehicle.name,
            brand: vehicle.brand,
            city: vehicle.city ?? null,
            year: vehicle.year,
            registration_number: vehicle.registration_number,
            fuel_type: vehicle.fuel_type,
            transmission: vehicle.transmission,
            seats: vehicle.seats,
            price_per_day: vehicle.price_per_day,
            security_deposit: vehicle.security_deposit,
            image: vehicle.image,
            featured: vehicle.featured,
            available: vehicle.available !== false,
          }}
          showImageUrlField
          showListingToggles={listingToggles}
        />
        {error ? <p className="text-sm text-red-300 sm:col-span-2 theme-light:text-red-700">{error}</p> : null}
        <div className="sm:col-span-2">
          <Button type="submit" disabled={pending}>
            {pending ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </form>
    </>
  )

  if (shell === 'none') {
    return <div className="space-y-1">{inner}</div>
  }

  return (
    <AdminCard>
      <AdminCardContent>{inner}</AdminCardContent>
    </AdminCard>
  )
}
