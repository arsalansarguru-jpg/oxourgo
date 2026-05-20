# Oxour Go — Enterprise Admin Dashboard

Production admin console at `/admin` with matte-black + electric-blue glass UI, RBAC, and Supabase-backed operations.

## Sidebar (14 sections)

| Nav | Route | Permission |
|-----|-------|------------|
| Dashboard | `/admin` | `admin.dashboard.read` |
| Fleet | `/admin/fleet` | `fleet.read` |
| Bookings | `/admin/bookings` | `bookings.read` |
| KYC Verification | `/admin/kyc` | `kyc.read` |
| Payments | `/admin/payments` | `payments.read` |
| Deposits | `/admin/financials` | `deposits.read` |
| Customers | `/admin/customers` | `customers.read` |
| Vehicle Tracking | `/admin/tracking` | `tracking.read` |
| Damage & Penalties | `/admin/damage` | `damage.read` |
| Traffic Fines | `/admin/traffic` | `traffic.read` |
| Reports | `/admin/analytics` | `analytics.read` |
| Notifications | `/admin/notifications` | `ops.alerts.read` |
| Support Tickets | `/admin/support` | `support.read` |
| Staff | `/admin/users` | `admin.users.manage` |
| Settings | `/admin/settings` | `settings.read` |

Legacy routes (`/admin/operations`, `/admin/whatsapp`, `/admin/violations`, help, training, backup, launch) remain reachable via URLs and dashboard links.

## Staff roles

| App role | Enterprise label |
|----------|------------------|
| `ops_admin` | Super Admin / Operations Manager |
| `fleet_manager` | Fleet Manager |
| `finance_manager` | Finance Executive |
| `kyc_reviewer` | KYC Officer |
| `support_agent` | Support Executive |

Set via `app_metadata.oxour_role` on Supabase Auth users.

## Database (new migration)

Apply: `supabase/migrations/20260626120000_enterprise_admin_operations.sql`

Adds:

- **vehicles** — compliance fields (insurance/PUC/RC expiry, GPS, FASTag, fuel, odometer)
- **vehicle_maintenance_logs**
- **damage_reports**
- **support_tickets**
- **invoices**
- **vehicle_compliance_alerts** (view)

Existing tables already cover bookings, KYC, payments, violations, audit, notifications, outbound jobs.

## Dashboard KPIs (`/admin`)

- Total bookings, active rentals, revenue today/month
- Pending KYC, available vehicles, under maintenance
- Pending refunds, late returns, damage claims
- 7-day charts: bookings, revenue, utilization, top vehicles
- Customer activity feed + live command center (queues, finance, fleet, audit)

## Deploy checklist

1. Run Supabase migrations on your project.
2. Set `SUPABASE_SERVICE_ROLE_KEY` for admin server loaders.
3. Assign staff roles in Auth metadata or `/admin/users`.
4. Configure Razorpay, Resend, WhatsApp env vars (see Settings page).
5. `npm run build` && deploy Next.js app.
