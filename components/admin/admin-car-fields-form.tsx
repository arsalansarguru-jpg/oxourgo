'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

import { adminUpdateCarAction } from '@/lib/admin/actions/fleet-actions'
import type { CarRow } from '@/lib/supabase/database.types'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { AdminCard, AdminCardContent } from '@/components/admin/admin-card'

export function AdminCarFieldsForm({ car }: { car: CarRow }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)

  return (
    <AdminCard>
      <AdminCardContent>
        <h2 className="mb-4 text-lg font-semibold text-soft">Vehicle details</h2>
        <form
          className="grid gap-4 sm:grid-cols-2"
          action={(formData) => {
            setError(null)
            start(async () => {
              const res = await adminUpdateCarAction(car.id, {
                brand: String(formData.get('brand') ?? ''),
                model: String(formData.get('model') ?? ''),
                year: Number(formData.get('year') ?? 0),
                registration_number: String(formData.get('registration_number') ?? ''),
                fuel_type: String(formData.get('fuel_type') ?? 'petrol'),
                transmission: String(formData.get('transmission') ?? 'auto'),
                seats: Number(formData.get('seats') ?? 5),
                pricing_per_day: Number(formData.get('pricing_per_day') ?? 0),
                security_deposit: Number(formData.get('security_deposit') ?? 0),
              })
              if (!res.ok) {
                setError(res.message)
                return
              }
              router.refresh()
            })
          }}
        >
          <Input name="brand" label="Brand" required defaultValue={car.brand} />
          <Input name="model" label="Model" required defaultValue={car.model} />
          <Input name="year" label="Year" type="number" required min={1990} max={2035} defaultValue={car.year} />
          <Input name="registration_number" label="Registration" required defaultValue={car.registration_number} />
          <Select name="fuel_type" label="Fuel" defaultValue={car.fuel_type}>
            <option value="petrol">Petrol</option>
            <option value="diesel">Diesel</option>
            <option value="electric">Electric</option>
            <option value="hybrid">Hybrid</option>
            <option value="cng">CNG</option>
          </Select>
          <Select name="transmission" label="Transmission" defaultValue={car.transmission}>
            <option value="auto">Automatic</option>
            <option value="manual">Manual</option>
          </Select>
          <Input name="seats" label="Seats" type="number" required min={2} max={9} defaultValue={car.seats} />
          <Input name="pricing_per_day" label="Price / day (INR)" type="number" required defaultValue={car.pricing_per_day} />
          <Input
            name="security_deposit"
            label="Security deposit (INR)"
            type="number"
            required
            min={0}
            defaultValue={car.security_deposit}
          />
          {error ? <p className="text-sm text-red-300 sm:col-span-2">{error}</p> : null}
          <div className="sm:col-span-2">
            <Button type="submit" disabled={pending}>
              {pending ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </form>
      </AdminCardContent>
    </AdminCard>
  )
}
