'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

import { adminCreateVehicleAction } from '@/lib/admin/actions/vehicle-actions'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Card, CardContent } from '@/components/ui/Card'
import { cn } from '@/lib/utils/cn'
import { cardSurfaceBase } from '@/components/ui/card-tokens'

export function AdminNewVehicleForm() {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)

  return (
    <Card className={cn(cardSurfaceBase, 'border border-stroke')}>
      <CardContent className="p-5 sm:p-6">
        <form
          className="grid gap-4 sm:grid-cols-2"
          action={(formData) => {
            setError(null)
            start(async () => {
              const res = await adminCreateVehicleAction({
                name: String(formData.get('name') ?? ''),
                brand: String(formData.get('brand') ?? ''),
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
              if (res.id) router.push(`/admin/fleet/${res.id}`)
              else router.push('/admin/fleet')
              router.refresh()
            })
          }}
        >
          <Input name="name" label="Listing name" required placeholder="BMW 5 Series 530i" className="sm:col-span-2" />
          <Input name="brand" label="Brand" required placeholder="BMW" />
          <Input name="year" label="Year" type="number" required min={1990} max={2035} defaultValue={2024} />
          <Input name="registration_number" label="Registration" required placeholder="MH01AB1234" />
          <Select name="fuel_type" label="Fuel" defaultValue="petrol">
            <option value="petrol">Petrol</option>
            <option value="diesel">Diesel</option>
            <option value="electric">Electric</option>
            <option value="hybrid">Hybrid</option>
            <option value="cng">CNG</option>
          </Select>
          <Select name="transmission" label="Transmission" defaultValue="auto">
            <option value="auto">Automatic</option>
            <option value="manual">Manual</option>
          </Select>
          <Input name="seats" label="Seats" type="number" required min={2} max={9} defaultValue={5} />
          <Input name="price_per_day" label="Price / day (INR)" type="number" required min={1} />
          <Input name="security_deposit" label="Security deposit (INR)" type="number" required min={0} defaultValue={0} />
          <label className="flex items-center gap-2 text-sm text-soft sm:col-span-2">
            <input type="checkbox" name="featured" value="on" className="h-4 w-4 rounded border-stroke-strong bg-matte" />
            Featured on fleet grid
          </label>
          <label className="flex items-center gap-2 text-sm text-soft sm:col-span-2">
            <input type="checkbox" name="available" value="on" defaultChecked className="h-4 w-4 rounded border-stroke-strong bg-matte" />
            Available for booking
          </label>
          {error ? <p className="text-sm text-red-300 sm:col-span-2">{error}</p> : null}
          <div className="sm:col-span-2">
            <Button type="submit" disabled={pending}>
              {pending ? 'Saving…' : 'Create catalog vehicle'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
