# Oxour Go — Backup & Disaster Recovery

Operational runbook for database safety, exports, and recovery. Complements the in-app **Admin → Backup & DR** page.

## Database backups (Supabase)

1. Enable **daily backups** on the Supabase project (Pro plan or higher for PITR).
2. For production, enable **Point-in-Time Recovery (PITR)** with a retention window that matches compliance needs (typically 7–30 days).
3. Store project credentials and service-role keys in a secrets manager — never in git.
4. Test restore to a **branch project** quarterly: Supabase Dashboard → Database → Backups → Restore.

## Application-level safety

| Mechanism | Purpose |
|-----------|---------|
| `deleted_at` / `archived_at` / `archived_by` | Soft-delete on vehicles, violations, bookings, KYC rows |
| `deleted_entity_snapshots` | JSON snapshot before archive for restore |
| `audit_logs` | Immutable staff action history |
| DB triggers on `vehicles`, `booking_violations` | Block accidental hard `DELETE` |
| KYC `storage_pinned` + `storage_retention_until` | Prevent premature document purge |

## Data exports (admin)

Staff with `admin.exports.read` can download from **Backup & DR**:

- Bookings, payments, pending dues, fleet, penalties, KYC summary
- Formats: **CSV** (UTF-8 BOM) and **Excel** (`.xls` HTML table, opens in Excel)
- Optional **from / to** date filters (UTC, `created_at`)

Exports are logged in `backup_operation_logs`.

## Archive & restore

1. **Archive** — Fleet delete and violation remove use soft-delete (not permanent delete).
2. **Restore** — Users with `admin.recovery.write` restore archived vehicles from Backup & DR.
3. Verify restored records in Fleet and Audit log (`fleet.restored`).

## KYC storage

- New uploads set `storage_retention_until` (default 7 years) and `recovery_metadata` (path, upload time).
- Approved documents should be **pinned** (`storage_pinned = true`) so cleanup jobs skip them.
- Do not delete `kyc` bucket objects unless retention expired and legal approves.

## Incident response checklist

1. Confirm scope (table, time range, affected bookings).
2. Pause destructive admin actions if needed.
3. Restore DB from Supabase backup/PITR to a branch; validate row counts.
4. Re-run exports for forensic copy.
5. Use **restore** in admin for individual archived rows when full DB restore is unnecessary.
6. Document in `backup_operation_logs` and post-mortem.

## Roles

| Permission | Capability |
|------------|------------|
| `admin.backup.read` | Backup & DR page, health indicators |
| `admin.exports.read` | CSV/Excel exports (plus domain read per export type) |
| `admin.recovery.write` | Restore archived vehicles |
| `fleet.delete` | Archive vehicles (soft-delete) |

## Health indicators (in-app)

The dashboard shows active fleet count, booking totals, 24h audit volume, pinned KYC docs, and archived vehicle count. Use these as a quick sanity check after deploys or incidents.
