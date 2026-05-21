import Link from 'next/link'
import { redirect } from 'next/navigation'

import { markAllNotificationsReadAction } from '@/app/(main)/dashboard/notifications/actions'
import { CustomerNotificationRow } from '@/features/dashboard/customer-notification-row'
import { groupNotificationsByDay } from '@/lib/customer/notification-groups'
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
  const groups = groupNotificationsByDay(rows)

  return (
    <div className="min-w-0 space-y-8">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-electric/90">Inbox</p>
          <h1 className="text-2xl font-semibold tracking-[-0.04em] text-soft sm:text-3xl">Notifications</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Booking updates, verification outcomes, and payment milestones land here as soon as they are recorded for your
            account.
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
        <div className="space-y-10">
          {groups.map((group) => (
            <section key={group.sortKey} className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">{group.label}</h2>
              <ul className="space-y-3">
                {group.rows.map((row) => (
                  <CustomerNotificationRow key={row.id} row={row} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <p className="text-center text-sm text-muted">
        <Link href="/dashboard" className="text-electric hover:underline">
          ← Dashboard home
        </Link>
      </p>
    </div>
  )
}
