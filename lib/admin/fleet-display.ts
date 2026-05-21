/** Display labels for catalog vehicles and physical fleet units. */

export type FleetLabelInput = {
  id: string
  name?: string | null
  brand?: string | null
  registration_number?: string | null
  internal_unit_code?: string | null
}

export function fleetCatalogTitle(v: FleetLabelInput): string {
  const reg = v.registration_number?.trim()
  const name = v.name?.trim()
  const brand = v.brand?.trim()
  if (reg) return reg
  if (name && brand) return `${brand} ${name}`.trim()
  if (name) return name
  if (brand) return brand
  return `Unit ${v.id.slice(0, 8).toUpperCase()}`
}

export function fleetCatalogSubtitle(v: FleetLabelInput): string | null {
  const reg = v.registration_number?.trim()
  const name = v.name?.trim()
  const brand = v.brand?.trim()
  if (reg && (name || brand)) return [brand, name].filter(Boolean).join(' ')
  const code = v.internal_unit_code?.trim()
  if (code) return code
  return null
}
