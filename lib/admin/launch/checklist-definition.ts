/** Launch checklist sections and item keys (stable IDs for DB + probes). */

export type LaunchSectionId =
  | 'domain_ssl'
  | 'auth'
  | 'bookings'
  | 'kyc'
  | 'payments'
  | 'fleet'
  | 'admin'
  | 'backups'
  | 'monitoring'
  | 'mobile_qa'

export type LaunchChecklistItemDef = {
  key: string
  section: LaunchSectionId
  label: string
  description: string
  /** Automated probes set status at fetch time; manual items use DB completions. */
  kind: 'auto' | 'manual'
}

export type LaunchQaTestDef = {
  key: string
  label: string
  description: string
}

export const LAUNCH_SECTION_LABELS: Record<LaunchSectionId, string> = {
  domain_ssl: 'Domain & SSL',
  auth: 'Authentication',
  bookings: 'Bookings',
  kyc: 'KYC',
  payments: 'Payments',
  fleet: 'Fleet',
  admin: 'Admin',
  backups: 'Backups',
  monitoring: 'Monitoring',
  mobile_qa: 'Mobile QA',
}

export const LAUNCH_CHECKLIST_ITEMS: readonly LaunchChecklistItemDef[] = [
  // Domain & SSL
  { key: 'domain.public_url', section: 'domain_ssl', label: 'Public site URL configured', description: 'NEXT_PUBLIC_APP_URL or Vercel URL resolves for emails and links.', kind: 'auto' },
  { key: 'domain.https_production', section: 'domain_ssl', label: 'HTTPS in production', description: 'Production deployment serves over TLS.', kind: 'auto' },
  { key: 'domain.custom_verified', section: 'domain_ssl', label: 'Custom domain verified', description: 'DNS points to hosting; apex and www tested.', kind: 'manual' },
  { key: 'domain.ssl_valid', section: 'domain_ssl', label: 'SSL certificate valid', description: 'No expiry warnings; HSTS configured if applicable.', kind: 'manual' },
  // Auth
  { key: 'auth.supabase_public', section: 'auth', label: 'Supabase client keys', description: 'NEXT_PUBLIC_SUPABASE_URL and anon/publishable key present.', kind: 'auto' },
  { key: 'auth.service_role', section: 'auth', label: 'Admin service role', description: 'SUPABASE_SERVICE_ROLE_KEY for server-side admin operations.', kind: 'auto' },
  { key: 'auth.rbac_staff', section: 'auth', label: 'Staff RBAC configured', description: 'oxour_role assigned for all staff accounts.', kind: 'manual' },
  { key: 'auth.login_smoke', section: 'auth', label: 'Login smoke test', description: 'Staff and customer login/logout verified on target environment.', kind: 'manual' },
  // Bookings
  { key: 'bookings.data_access', section: 'bookings', label: 'Booking data accessible', description: 'Admin can query bookings without errors.', kind: 'auto' },
  { key: 'bookings.lifecycle', section: 'bookings', label: 'Lifecycle transitions tested', description: 'pending → confirmed → active → completed path verified.', kind: 'manual' },
  { key: 'bookings.manual_ops', section: 'bookings', label: 'Manual ops workflow', description: 'Holds, overrides, and notes tested on staging.', kind: 'manual' },
  { key: 'bookings.whatsapp', section: 'bookings', label: 'WhatsApp intake', description: 'Inbound booking conversations linked to admin.', kind: 'manual' },
  // KYC
  { key: 'kyc.queue_access', section: 'kyc', label: 'KYC queue accessible', description: 'Review queue loads with pending documents.', kind: 'auto' },
  { key: 'kyc.review_flow', section: 'kyc', label: 'Approve/reject tested', description: 'Reviewer decisions persist and notify customer.', kind: 'manual' },
  { key: 'kyc.storage_retention', section: 'kyc', label: 'Storage retention active', description: 'Pinned/retention columns protect approved documents.', kind: 'auto' },
  { key: 'kyc.customer_upload', section: 'kyc', label: 'Customer upload flow', description: 'Dashboard upload and resubmission verified.', kind: 'manual' },
  // Payments
  { key: 'payments.module_access', section: 'payments', label: 'Payments module accessible', description: 'Admin payments board loads.', kind: 'auto' },
  { key: 'payments.razorpay', section: 'payments', label: 'Gateway keys (if online)', description: 'Razorpay keys present when online checkout enabled.', kind: 'auto' },
  { key: 'payments.partial', section: 'payments', label: 'Partial payment flow', description: 'Ledger events for partial receipts verified.', kind: 'manual' },
  { key: 'payments.deposit_refund', section: 'payments', label: 'Deposit & refund path', description: 'Post-return financial close-out tested.', kind: 'manual' },
  // Fleet
  { key: 'fleet.catalog', section: 'fleet', label: 'Active fleet catalog', description: 'At least one non-archived vehicle available.', kind: 'auto' },
  { key: 'fleet.handover', section: 'fleet', label: 'Handover inspection', description: 'Pickup photos and mark handed over tested.', kind: 'manual' },
  { key: 'fleet.return', section: 'fleet', label: 'Return inspection', description: 'Return checklist and mark returned tested.', kind: 'manual' },
  { key: 'fleet.archive_restore', section: 'fleet', label: 'Archive & restore', description: 'Soft-delete archive and recovery tested.', kind: 'manual' },
  // Admin
  { key: 'admin.command_center', section: 'admin', label: 'Command center operational', description: 'Dashboard metrics load for staff roles.', kind: 'auto' },
  { key: 'admin.audit_trail', section: 'admin', label: 'Audit trail active', description: 'Staff actions write to audit_logs.', kind: 'auto' },
  { key: 'admin.help_sops', section: 'admin', label: 'Help & SOPs reviewed', description: 'Internal procedures published and role-scoped.', kind: 'manual' },
  { key: 'admin.staff_assigned', section: 'admin', label: 'Staff roles assigned', description: 'All operators have correct oxour_role.', kind: 'manual' },
  // Backups
  { key: 'backups.health', section: 'backups', label: 'Backup health green', description: 'No critical backup indicators.', kind: 'auto' },
  { key: 'backups.export', section: 'backups', label: 'Data export tested', description: 'CSV/Excel export downloaded and validated.', kind: 'manual' },
  { key: 'backups.recovery', section: 'backups', label: 'Recovery workflow', description: 'Archive restore or snapshot path verified.', kind: 'manual' },
  { key: 'backups.recent_success', section: 'backups', label: 'Recent backup operation', description: 'Last logged backup/export operation succeeded.', kind: 'auto' },
  // Monitoring
  { key: 'monitoring.sentry', section: 'monitoring', label: 'Sentry configured', description: 'Error tracking DSN for production.', kind: 'auto' },
  { key: 'monitoring.analytics', section: 'monitoring', label: 'Product analytics', description: 'PostHog or equivalent enabled for production.', kind: 'auto' },
  { key: 'monitoring.ops_email', section: 'monitoring', label: 'Ops alert email routing', description: 'OPS_ALERT_EMAILS reaches on-call inbox.', kind: 'auto' },
  { key: 'monitoring.errors_verified', section: 'monitoring', label: 'Error pipeline verified', description: 'Test error appears in Sentry/dashboard.', kind: 'manual' },
  // Mobile QA
  { key: 'mobile.ios_safari', section: 'mobile_qa', label: 'iOS Safari booking flow', description: 'Customer journey on iPhone Safari.', kind: 'manual' },
  { key: 'mobile.android_chrome', section: 'mobile_qa', label: 'Android Chrome flow', description: 'Customer journey on Android Chrome.', kind: 'manual' },
  { key: 'mobile.admin_tablet', section: 'mobile_qa', label: 'Admin on tablet', description: 'Critical admin screens usable on tablet width.', kind: 'manual' },
  { key: 'mobile.notifications', section: 'mobile_qa', label: 'Notifications & realtime', description: 'Email/WhatsApp/ops alerts delivered as expected.', kind: 'manual' },
] as const

export const LAUNCH_QA_TESTS: readonly LaunchQaTestDef[] = [
  { key: 'qa.e2e_customer_booking', label: 'E2E: signup → booking → payment', description: 'Full customer path on staging then production smoke.' },
  { key: 'qa.e2e_trip_close', label: 'E2E: handover → return → deposit', description: 'Fleet and finance close-out without data loss.' },
  { key: 'qa.finance_export', label: 'Finance reconciliation export', description: 'Export matches ledger for sample period.' },
  { key: 'qa.staging_load', label: 'Staging load / smoke', description: 'Concurrent bookings and admin actions stable.' },
  { key: 'qa.production_signoff', label: 'Production sign-off (ops lead)', description: 'Formal go-live approval recorded.' },
] as const
