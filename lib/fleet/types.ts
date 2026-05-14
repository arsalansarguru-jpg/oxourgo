export type FleetFilterId =
  | 'SUV'
  | 'Sedan'
  | 'Hatchback'
  | 'Luxury'
  | 'Budget'
  | 'Automatic'
  | 'Manual'

export type FleetCarCategory = 'Luxury' | 'SUV' | 'Sedan' | 'Hatchback' | 'Budget'
export type FleetCarAvailabilityLabel = 'Available' | 'Unavailable'
export type FleetCarTransmission = 'Auto' | 'Manual'
export type FleetCarFuel = 'Petrol' | 'Diesel' | 'Electric' | 'Hybrid' | 'CNG'

export type FleetCar = {
  id: string
  brand: string
  model: string
  /** Full listing title (e.g. from `vehicles.name` or brand + model). */
  displayName: string
  year: number
  registrationNumber: string
  fuel: FleetCarFuel
  transmission: FleetCarTransmission
  seats: number
  pricePerDay: number
  securityDeposit: number
  availability: FleetCarAvailabilityLabel
  featured: boolean
  category: FleetCarCategory
  imageUrl: string
  /** Optional hub / city label for search (Supabase `vehicles.city`). */
  city?: string | null
}
