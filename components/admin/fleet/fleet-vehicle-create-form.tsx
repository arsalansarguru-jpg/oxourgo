'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

import { AdminCard, AdminCardContent } from '@/components/admin/admin-card'
import { FleetVehicleFormFields } from '@/components/admin/fleet/fleet-vehicle-form-fields'
import { adminCreateVehicleAction } from '@/lib/admin/actions/vehicle-actions'
import { Button } from '@/components/ui/Button'

type Props = {
  /** When set, omits outer AdminCard (e.g. inside a modal). */
  embedded?: boolean
  /** After successful create — return new id. */
  onCreated?: (id: string) => void
}

export function FleetVehicleCreateForm({ embedded, onCreated }: Props) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const form = (
    <form
      className="grid gap-4 sm:grid-cols-2"
      action={(formData) => {
        setError(null)
        start(async () => {
          const res = await adminCreateVehicleAction({
            name: String(formData.get('name') ?? ''),
            brand: String(formData.get('brand') ?? ''),
            city: String(formData.get('city') ?? '').trim() || null,
            year: Number(formData.get('year') ?? 0),
            registration_number: String(formData.get('registration_number') ?? ''),
            fuel_type: String(formData.get('fuel_type') ?? 'petrol'),
            transmission: String(formData.get('transmission') ?? 'auto'),
            seats: Number(formData.get('seats') ?? 5),
            price_per_day: Number(formData.get('price_per_day') ?? 0),
            security_deposit: Number(formData.get('security_deposit') ?? 0),
            featured: formData.get('featured') === 'on',
            available: formData.get('available') === 'on',
          })
          if (!res.ok) {
            setError(res.message)
            return
          }
          if (res.id && onCreated) {
            router.refresh()
            onCreated(res.id)
            return
          }
          if (res.id) router.push(`/admin/fleet/${res.id}`)
          else router.push('/admin/fleet')
          router.refresh()
        })
      }}
    >
      <FleetVehicleFormFields defaults={{}} showListingToggles />
      <p className="rounded-lg border border-electric/20 bg-electric/10 px-3 py-2 text-xs text-muted sm:col-span-2">
        After you create the vehicle, you can upload multiple photos (exterior, interior, dashboard, etc.) on the
        vehicle detail page. Those images appear in the booking gallery for customers.
      </p>
      {error ? <p className="text-sm text-red-300 sm:col-span-2">{error}</p> : null}
      <div className="sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? 'Saving…' : 'Create catalog vehicle'}
        </Button>
      </div>
    </form>
  )

  if (embedded) {
    return form
  }

  return (
    <AdminCard>
      <AdminCardContent>{form}</AdminCardContent>
    </AdminCard>
  )
}
