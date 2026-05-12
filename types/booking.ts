export type BookingStatus = 'active' | 'upcoming' | 'completed' | 'cancelled'

export type Booking = {
  id: string
  carId: string
  carName: string
  pickup: string
  dropoff: string
  status: BookingStatus
  total: number
  invoiceId: string
}
