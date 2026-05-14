'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

import { adminCreateCarAction } from '@/lib/admin/actions/fleet-actions'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { AdminCard, AdminCardContent } from '@/components/admin/admin-card'

export function AdminNewCarForm() {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)

  return (
    <AdminCard>
      <AdminCardContent>
        <form
          className="grid gap-4 sm:grid-cols-2"
          action={(formData) => {
            setError(null)
            start(async () => {
              const res = await adminCreateCarAction({
                brand: String(formData.get('brand') ?? ''),
                model: String(formData.get('model') ?? ''),
                year: Number(formData.get('year') ?? 0),
                registration_number: String(formData.get('registration_number') ?? ''),
                fuel_type: String(formData.get('fuel_type') ?? 'petrol'),
                transmission: String(formData.get('transmission') ?? 'auto'),
                seats: Number(formData.get('seats') ?? 5),
                pricing_per_day: Number(formData.get('pricing_per_day') ?? 0),
                security_deposit: Number(formData.get('security_deposit') ?? 0),
                availability_status: String(formData.get('availability_status') ?? 'available'),
                featured: formData.get('featured') === 'on',
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
          <Input name="brand" label="Brand" required placeholder="BMW" />
          <Input name="model" label="Model" required placeholder="5 Series" />
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
          <Input name="pricing_per_day" label="Price / day (INR)" type="number" required min={1} />
          <Input name="security_deposit" label="Security deposit (INR)" type="number" required min={0} defaultValue={0} />
          <Select name="availability_status" label="Availability" defaultValue="available">
            <option value="available">Available</option>
            <option value="unavailable">Unavailable</option>
            <option value="maintenance">Maintenance</option>
          </Select>
          <label className="flex items-center gap-2 text-sm text-soft sm:col-span-2">
            <input type="checkbox" name="featured" className="h-4 w-4 rounded border-stroke-strong bg-matte" />
            Featured on fleet grid
          </label>
          {error ? <p className="text-sm text-red-300 sm:col-span-2">{error}</p> : null}
          <div className="sm:col-span-2">
            <Button type="submit" disabled={pending}>
              {pending ? 'Saving…' : 'Create vehicle'}
            </Button>
          </div>
        </form>
      </AdminCardContent>
    </AdminCard>
  )
}
