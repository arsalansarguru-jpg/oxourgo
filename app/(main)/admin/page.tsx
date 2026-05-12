import Link from 'next/link'

import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { adminOverviewStats } from '@/lib/admin/data/overview'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { cn } from '@/lib/utils/cn'
import { cardSurfaceHover, cardSurfaceTransition } from '@/components/ui/card-tokens'

export const dynamic = 'force-dynamic'

export default async function AdminHomePage() {
  let stats = { cars: 0, bookings: 0, pendingBookings: 0, pendingKyc: 0 }
  try {
    stats = await adminOverviewStats()
  } catch {
    // Missing service role or network — layout already warns.
  }

  const tiles = [
    { label: 'Fleet vehicles', value: stats.cars, href: '/admin/fleet' },
    { label: 'Total bookings', value: stats.bookings, href: '/admin/bookings' },
    { label: 'Pending approval', value: stats.pendingBookings, href: '/admin/bookings' },
    { label: 'KYC in queue', value: stats.pendingKyc, href: '/admin/kyc' },
  ] as const

  return (
    <div className="space-y-10">
      <AdminPageHeader
        title="Control center"
        description="Live Supabase metrics and shortcuts into fleet, reservations, customers, KYC, and payments."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((t) => (
          <Link key={t.label} href={t.href} className="group block">
            <Card
              className={cn(
                cardSurfaceTransition,
                cardSurfaceHover,
                'h-full border border-white/[0.08] bg-carbon/[0.35]',
              )}
            >
              <CardContent className="p-5">
                <p className="text-xs font-medium uppercase tracking-wide text-muted">{t.label}</p>
                <p className="mt-3 text-3xl font-semibold tabular-nums tracking-tight text-soft">{t.value}</p>
                <p className="mt-3 text-xs text-electric/90 opacity-0 transition-opacity group-hover:opacity-100">
                  Open →
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Button to="/admin/fleet/new">Add vehicle</Button>
        <Button variant="secondary" to="/admin/bookings">
          Review bookings
        </Button>
        <Button variant="secondary" to="/admin/kyc">
          KYC queue
        </Button>
      </div>
    </div>
  )
}
