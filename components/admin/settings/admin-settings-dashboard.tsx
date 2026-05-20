'use client'

import { Bell, CreditCard, Mail, MessageCircle, Shield, Users } from 'lucide-react'

import { AdminCard, AdminCardContent } from '@/components/admin/admin-card'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { RoleBadge } from '@/components/auth/role-badge'
import type { AppAuthRole } from '@/lib/auth/roles'
import { PERMISSIONS, getPermissionsForRole } from '@/lib/auth/permissions'

const INTEGRATIONS = [
  { name: 'Supabase Auth', status: 'Connected', detail: 'JWT + RLS staff buckets' },
  { name: 'Razorpay', status: 'Configured', detail: 'Booking payments & webhooks' },
  { name: 'Resend', status: 'Email', detail: 'Transactional templates' },
  { name: 'WhatsApp Ops', status: 'Active', detail: 'Inbound assistant + manual ops' },
  { name: 'PostHog', status: 'Analytics', detail: 'Product telemetry' },
  { name: 'Sentry', status: 'Monitoring', detail: 'Error tracking' },
] as const

const NOTIFICATION_EVENTS = [
  'Booking confirmation',
  'Payment received',
  'KYC approved / rejected',
  'Vehicle assigned',
  'Late return warning',
  'Refund completed',
  'Insurance / PUC expiry',
  'Maintenance due',
] as const

const STAFF_ROLES: { role: AppAuthRole; label: string }[] = [
  { role: 'ops_admin', label: 'Super Admin / Operations Manager' },
  { role: 'fleet_manager', label: 'Fleet Manager' },
  { role: 'finance_manager', label: 'Finance Executive' },
  { role: 'kyc_reviewer', label: 'KYC Officer' },
  { role: 'support_agent', label: 'Support Executive' },
]

export function AdminSettingsDashboard({
  email,
  appRole,
  canWrite,
}: {
  email: string | undefined
  appRole: AppAuthRole
  canWrite: boolean
}) {
  const permissionCount = getPermissionsForRole(appRole).size

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Workspace"
        title="Settings"
        description="Integrations, notification automation, role-based access, and operational defaults for Oxour Go admin."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <AdminCard>
          <AdminCardContent className="space-y-4 p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-electric" aria-hidden />
              <h2 className="font-display text-base font-semibold text-soft">Your session</h2>
            </div>
            <p className="text-sm text-muted">{email ?? '—'}</p>
            <RoleBadge role={appRole} />
            <p className="text-xs text-muted">
              {permissionCount} of {PERMISSIONS.length} permissions · {canWrite ? 'Settings write enabled' : 'Read-only'}
            </p>
          </AdminCardContent>
        </AdminCard>

        <AdminCard>
          <AdminCardContent className="space-y-4 p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-electric" aria-hidden />
              <h2 className="font-display text-base font-semibold text-soft">Staff roles</h2>
            </div>
            <ul className="space-y-2 text-sm">
              {STAFF_ROLES.map(({ role, label }) => (
                <li key={role} className="flex justify-between gap-2 border-b border-white/[0.06] py-2">
                  <span className="text-soft">{label}</span>
                  <span className="text-muted tabular-nums">{getPermissionsForRole(role).size} perms</span>
                </li>
              ))}
            </ul>
            <a href="/admin/users" className="text-sm font-medium text-electric hover:underline">
              Manage staff →
            </a>
          </AdminCardContent>
        </AdminCard>
      </div>

      <AdminCard>
        <AdminCardContent className="space-y-4 p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-electric" aria-hidden />
            <h2 className="font-display text-base font-semibold text-soft">Integrations</h2>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {INTEGRATIONS.map((i) => (
              <li
                key={i.name}
                className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3"
              >
                <p className="font-medium text-soft">{i.name}</p>
                <p className="text-xs text-electric">{i.status}</p>
                <p className="mt-1 text-xs text-muted">{i.detail}</p>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted">Secrets are stored in deployment environment variables — never in the client bundle.</p>
        </AdminCardContent>
      </AdminCard>

      <AdminCard>
        <AdminCardContent className="space-y-4 p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-electric" aria-hidden />
            <h2 className="font-display text-base font-semibold text-soft">Notification automation</h2>
          </div>
          <p className="text-sm text-muted">
            Outbound jobs dispatch email, SMS, and WhatsApp via the cron pipeline and booking lifecycle hooks.
          </p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {NOTIFICATION_EVENTS.map((e) => (
              <li key={e} className="flex items-center gap-2 text-sm text-soft">
                <Mail className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden />
                {e}
              </li>
            ))}
          </ul>
          <a href="/admin/notifications" className="inline-flex items-center gap-1 text-sm font-medium text-electric hover:underline">
            <MessageCircle className="h-4 w-4" aria-hidden />
            Open alert center
          </a>
        </AdminCardContent>
      </AdminCard>
    </div>
  )
}
