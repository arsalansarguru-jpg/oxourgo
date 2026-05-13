import Link from 'next/link'
import { redirect } from 'next/navigation'

import { markAllNotificationsReadAction } from '@/app/(main)/dashboard/notifications/actions'
import { CustomerNotificationRow } from '@/features/dashboard/customer-notification-row'
import { listNotificationsForUser } from '@/lib/customer/notifications-queries'
import { getAuthenticatedUser } from '@/lib/auth/server'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Bell } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function NotificationsCenterPage() {
  const user = await getAuthenticatedUser()
  if (!user) {
    redirect(`/login?${new URLSearchParams({ redirect: '/dashboard/notifications' }).toString()}`)
  }

  const rows = await listNotificationsForUser(user.id)

  return (
    <div className="space-y-8">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-electric/90">Inbox</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-soft">Notifications</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Booking, KYC, and payment updates appear here in real time when Realtime is enabled for{' '}
            <code className="rounded bg-fill-glass-strong px-1 font-mono text-xs">notifications</code>.
          </p>
        </div>
        {rows.some((r) => !r.read_at) ? (
          <form action={markAllNotificationsReadAction}>
            <Button type="submit" variant="secondary" size="sm">
              Mark all read
            </Button>
          </form>
        ) : null}
      </header>

      {rows.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="You are all caught up"
          description="When bookings move through review, KYC decisions land, or payments change, we will record them here."
          actionLabel="Browse fleet"
          to="/fleet"
        />
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => (
            <CustomerNotificationRow key={row.id} row={row} />
          ))}
        </ul>
      )}

      <p className="text-center text-sm text-muted">
        <Link href="/dashboard" className="text-electric hover:underline">
          ← Dashboard home
        </Link>
      </p>
    </div>
  )
}
