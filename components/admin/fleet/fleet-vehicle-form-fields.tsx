import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'

export type FleetVehicleFormDefaults = {
  name: string
  brand: string
  city?: string | null
  year: number
  registration_number: string
  fuel_type: string
  transmission: string
  seats: number
  price_per_day: number
  security_deposit: number
  image?: string | null
  featured?: boolean
  available?: boolean
}

type Props = {
  defaults: Partial<FleetVehicleFormDefaults>
  showImageUrlField?: boolean
  showListingToggles?: boolean
}

export function FleetVehicleFormFields({ defaults, showImageUrlField, showListingToggles }: Props) {
  const year = defaults.year ?? 2024
  const seats = defaults.seats ?? 5
  const fuel = defaults.fuel_type ?? 'petrol'
  const transmission = defaults.transmission ?? 'auto'
  const deposit = defaults.security_deposit ?? 0

  return (
    <>
      <Input
        name="name"
        label="Model"
        required
        placeholder="5 Series 530i"
        defaultValue={defaults.name ?? ''}
        className="sm:col-span-2"
      />
      <Input name="brand" label="Brand" required placeholder="Hyundai" defaultValue={defaults.brand ?? ''} />
      <Input name="city" label="City / hub" placeholder="Mumbai, BKC…" defaultValue={defaults.city ?? ''} />
      <Input name="year" label="Year" type="number" required min={1990} max={2100} defaultValue={year} />
      <Input
        name="registration_number"
        label="Registration"
        required
        placeholder="MH01AB1234"
        defaultValue={defaults.registration_number ?? ''}
      />
      <Select name="fuel_type" label="Fuel" defaultValue={fuel}>
        <option value="petrol">Petrol</option>
        <option value="diesel">Diesel</option>
        <option value="electric">Electric</option>
        <option value="hybrid">Hybrid</option>
        <option value="cng">CNG</option>
      </Select>
      <Select name="transmission" label="Transmission" defaultValue={transmission}>
        <option value="auto">Automatic</option>
        <option value="manual">Manual</option>
      </Select>
      <Input name="seats" label="Seats" type="number" required min={2} max={12} defaultValue={seats} />
      <Input
        name="price_per_day"
        label="Price / day (INR)"
        type="number"
        required
        min={1}
        defaultValue={defaults.price_per_day ?? ''}
      />
      <Input
        name="security_deposit"
        label="Security deposit (INR)"
        type="number"
        required
        min={0}
        defaultValue={deposit}
      />
      {showImageUrlField ? (
        <Input
          name="image"
          label="Image (URL or fleet bucket path)"
          defaultValue={defaults.image ?? ''}
          placeholder="https://… or vehicleId/catalog-….webp"
          className="sm:col-span-2"
        />
      ) : null}
      {showListingToggles ? (
        <>
          <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-soft theme-light:border-stroke-strong theme-light:bg-white/70 sm:col-span-2">
            <input
              type="checkbox"
              name="featured"
              value="on"
              defaultChecked={Boolean(defaults.featured)}
              className="h-4 w-4 rounded border-stroke-strong bg-matte text-electric theme-light:bg-white"
            />
            Featured on fleet grid
          </label>
          <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-soft theme-light:border-stroke-strong theme-light:bg-white/70 sm:col-span-2">
            <input
              type="checkbox"
              name="available"
              value="on"
              defaultChecked={defaults.available !== false}
              className="h-4 w-4 rounded border-stroke-strong bg-matte text-electric theme-light:bg-white"
            />
            Available for booking
          </label>
        </>
      ) : null}
    </>
  )
}
