'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

import { adminUpdateVehicleAction } from '@/lib/admin/actions/vehicle-actions'
import type { AdminVehicleRow } from '@/lib/admin/data/fleet'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Card, CardContent } from '@/components/ui/Card'
import { cn } from '@/lib/utils/cn'
import { cardSurfaceBase } from '@/components/ui/card-tokens'

export function AdminVehicleFieldsForm({ vehicle }: { vehicle: AdminVehicleRow }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)

  return (
    <Card className={cn(cardSurfaceBase, 'border border-stroke')}>
      <CardContent className="p-5 sm:p-6">
        <h2 className="mb-4 text-lg font-semibold text-soft">Catalog details</h2>
        <form
          className="grid gap-4 sm:grid-cols-2"
          action={(formData) => {
            setError(null)
            start(async () => {
              const res = await adminUpdateVehicleAction(vehicle.id, {
                name: String(formData.get('name') ?? '').trim(),
                brand: String(formData.get('brand') ?? '').trim(),
                year: Number(formData.get('year') ?? 0),
                registration_number: String(formData.get('registration_number') ?? '').trim(),
                fuel_type: String(formData.get('fuel_type') ?? 'petrol'),
                transmission: String(formData.get('transmission') ?? 'auto'),
                seats: Number(formData.get('seats') ?? 5),
                price_per_day: Number(formData.get('price_per_day') ?? 0),
                security_deposit: Number(formData.get('security_deposit') ?? 0),
                image: String(formData.get('image') ?? '').trim() || null,
              })
              if (!res.ok) {
                setError(res.message)
                return
              }
              router.refresh()
            })
          }}
        >
          <Input name="name" label="Listing name" required defaultValue={vehicle.name} className="sm:col-span-2" />
          <Input name="brand" label="Brand" required defaultValue={vehicle.brand} />
          <Input name="year" label="Year" type="number" required min={1990} max={2035} defaultValue={vehicle.year} />
          <Input name="registration_number" label="Registration" required defaultValue={vehicle.registration_number} />
          <Select name="fuel_type" label="Fuel" defaultValue={vehicle.fuel_type}>
            <option value="petrol">Petrol</option>
            <option value="diesel">Diesel</option>
            <option value="electric">Electric</option>
            <option value="hybrid">Hybrid</option>
            <option value="cng">CNG</option>
          </Select>
          <Select name="transmission" label="Transmission" defaultValue={vehicle.transmission}>
            <option value="auto">Automatic</option>
            <option value="manual">Manual</option>
          </Select>
          <Input name="seats" label="Seats" type="number" required min={2} max={9} defaultValue={vehicle.seats} />
          <Input name="price_per_day" label="Price / day (INR)" type="number" required min={1} defaultValue={vehicle.price_per_day} />
          <Input
            name="security_deposit"
            label="Security deposit (INR)"
            type="number"
            required
            min={0}
            defaultValue={vehicle.security_deposit}
          />
          <Input
            name="image"
            label="Image (URL or fleet bucket path)"
            defaultValue={vehicle.image ?? ''}
            placeholder="https://… or covers/abc.webp"
            className="sm:col-span-2"
          />
          {error ? <p className="text-sm text-red-300 sm:col-span-2">{error}</p> : null}
          <div className="sm:col-span-2">
            <Button type="submit" disabled={pending}>
              {pending ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
