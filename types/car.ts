export type CarCategory = 'Luxury' | 'SUV' | 'Sedan' | 'Hatchback' | 'Budget'

export type CarStatus = 'Available' | 'Unavailable'

export type FuelType = 'Petrol' | 'Diesel' | 'Electric'

export type Transmission = 'Auto' | 'Manual'

export type Car = {
  id: string
  name: string
  status: CarStatus
  category: CarCategory
  rating: number
  reviews: number
  fuel: FuelType
  transmission: Transmission
  seats: number
  pricePerDay: number
  imageUrl: string
  gallery: string[]
  featured: boolean
  description: string
  specs: Record<string, string>
  securityDeposit: number
  unavailableDates?: string[]
}
