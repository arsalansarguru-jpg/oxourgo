/**
 * @deprecated Unused — live dashboard uses `AdminDashboardOverview` + Supabase.
 * Do not import into routes; kept only to avoid breaking stale references during cleanup.
 */

export const dashboardDummyMetrics = {
  totalRevenue: 4_282_000,
  revenueDeltaPct: 14.2,
  activeBookings: 156,
  bookingsDeltaPct: 8.1,
  fleetUtilizationPct: 67,
  utilizationDeltaPct: -2.4,
  pendingKyc: 23,
  kycDeltaPct: 5.5,
} as const

/** Last 8 months — revenue in lakhs (₹) for chart scaling. */
export const dashboardRevenueSeries = [
  { label: 'Jun', value: 28 },
  { label: 'Jul', value: 32 },
  { label: 'Aug', value: 30 },
  { label: 'Sep', value: 38 },
  { label: 'Oct', value: 41 },
  { label: 'Nov', value: 36 },
  { label: 'Dec', value: 44 },
  { label: 'Jan', value: 48 },
] as const

export const dashboardRevenueSecondary = {
  collectionRatePct: 94.2,
  avgBookingValue: 18_400,
  targetAttainmentPct: 108,
} as const

export type DummyBookingRow = {
  id: string
  guest: string
  vehicle: string
  pickup: string
  status: 'confirmed' | 'pending_payment' | 'completed'
  total: number
}

export const dashboardRecentBookings: DummyBookingRow[] = [
  {
    id: 'bk_8f2a',
    guest: 'A. Mehta',
    vehicle: 'Range Rover Sport',
    pickup: 'Jan 14 · 10:00',
    status: 'confirmed',
    total: 186_000,
  },
  {
    id: 'bk_7c91',
    guest: 'S. Kapoor',
    vehicle: 'Mercedes E-Class',
    pickup: 'Jan 14 · 14:30',
    status: 'pending_payment',
    total: 72_500,
  },
  {
    id: 'bk_3d44',
    guest: 'R. Iyer',
    vehicle: 'BMW 5 Series',
    pickup: 'Jan 15 · 09:00',
    status: 'confirmed',
    total: 94_200,
  },
  {
    id: 'bk_9e01',
    guest: 'N. Shah',
    vehicle: 'Audi Q7',
    pickup: 'Jan 15 · 11:15',
    status: 'completed',
    total: 128_000,
  },
  {
    id: 'bk_2b77',
    guest: 'P. Desai',
    vehicle: 'Volvo XC90',
    pickup: 'Jan 16 · 08:00',
    status: 'confirmed',
    total: 156_400,
  },
] as const

export const dashboardFleetStatus = [
  { label: 'Available', count: 42, pct: 52, tone: 'emerald' as const },
  { label: 'On hire', count: 28, pct: 35, tone: 'electric' as const },
  { label: 'Service', count: 6, pct: 7, tone: 'amber' as const },
  { label: 'Hold', count: 5, pct: 6, tone: 'muted' as const },
] as const

export type DummyActivity = { id: string; time: string; title: string; detail: string }

export const dashboardActivityFeed: DummyActivity[] = [
  {
    id: '1',
    time: '12m ago',
    title: 'Payment captured',
    detail: 'Booking bk_8f2a · ₹1,86,000',
  },
  {
    id: '2',
    time: '28m ago',
    title: 'KYC submitted',
    detail: 'Passport upload · Customer tier review',
  },
  {
    id: '3',
    time: '1h ago',
    title: 'Vehicle returned',
    detail: 'BMW 5 Series · Bandra hub',
  },
  {
    id: '4',
    time: '2h ago',
    title: 'Ops note added',
    detail: 'Booking bk_3d44 · Concierge follow-up',
  },
  {
    id: '5',
    time: '3h ago',
    title: 'Fleet featured toggle',
    detail: 'Range Rover Sport · Homepage slot',
  },
] as const

export type DummyPickup = { id: string; when: string; guest: string; vehicle: string; hub: string }

export const dashboardUpcomingPickups: DummyPickup[] = [
  { id: 'p1', when: 'Today · 15:30', guest: 'V. Malhotra', vehicle: 'Mercedes S-Class', hub: 'BKC' },
  { id: 'p2', when: 'Today · 17:00', guest: 'K. Reddy', vehicle: 'Lexus RX', hub: 'Andheri W' },
  { id: 'p3', when: 'Tomorrow · 09:00', guest: 'J. Bose', vehicle: 'Audi A6', hub: 'Worli' },
  { id: 'p4', when: 'Tomorrow · 11:30', guest: 'L. Fernandes', vehicle: 'Defender 110', hub: 'BKC' },
] as const

export const dashboardVehicleAvailability = [
  { category: 'SUV', available: 18, total: 24 },
  { category: 'Sedan', available: 14, total: 22 },
  { category: 'Luxury', available: 6, total: 10 },
  { category: 'EV', available: 4, total: 8 },
] as const
