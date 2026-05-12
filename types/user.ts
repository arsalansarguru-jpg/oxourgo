export type VerificationStatus = 'verified' | 'pending' | 'action_required'

export type UserProfile = {
  name: string
  email: string
  phone: string
  verification: VerificationStatus
  documentsOnFile: string[]
}

export type DashboardStats = {
  activeBookings: number
  upcomingTrips: number
  lifetimeSpend: number
  supportTickets: number
}
