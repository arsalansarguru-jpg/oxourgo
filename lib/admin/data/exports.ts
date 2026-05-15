import 'server-only'

import type { ExportColumn, ExportRow } from '@/lib/admin/export/spreadsheet'
import { createAdminClient } from '@/lib/supabase/admin'
import { logPostgrestError } from '@/lib/errors/safe-user-message'

export type ExportKind =
  | 'bookings'
  | 'payments'
  | 'pending-dues'
  | 'fleet'
  | 'penalties'
  | 'kyc-summary'

export type ExportDateRange = {
  from?: string
  to?: string
}

function applyDateRange<T extends { gte: (c: string, v: string) => T; lte: (c: string, v: string) => T }>(
  query: T,
  column: string,
  range: ExportDateRange,
): T {
  let q = query
  if (range.from) q = q.gte(column, range.from)
  if (range.to) q = q.lte(column, `${range.to}T23:59:59.999Z`)
  return q
}

const BOOKING_EXPORT_COLUMNS: ExportColumn[] = [
  { key: 'id', header: 'Booking ID' },
  { key: 'booking_status', header: 'Status' },
  { key: 'payment_status', header: 'Payment' },
  { key: 'pickup_date', header: 'Pickup' },
  { key: 'return_date', header: 'Return' },
  { key: 'total_rupees', header: 'Total (INR)' },
  { key: 'amount_paid', header: 'Paid (INR)' },
  { key: 'amount_due', header: 'Due (INR)' },
  { key: 'user_id', header: 'Customer ID' },
  { key: 'vehicle_id', header: 'Vehicle ID' },
  { key: 'created_at', header: 'Created' },
]

export async function fetchExportDataset(
  kind: ExportKind,
  range: ExportDateRange,
): Promise<{ columns: ExportColumn[]; rows: ExportRow[]; sheetName: string }> {
  switch (kind) {
    case 'bookings':
      return fetchBookingsExport(range)
    case 'payments':
      return fetchPaymentsExport(range)
    case 'pending-dues':
      return fetchPendingDuesExport(range)
    case 'fleet':
      return fetchFleetExport(range)
    case 'penalties':
      return fetchPenaltiesExport(range)
    case 'kyc-summary':
      return fetchKycSummaryExport(range)
    default:
      return { columns: [], rows: [], sheetName: 'Export' }
  }
}

async function fetchBookingsExport(range: ExportDateRange) {
  const admin = createAdminClient()
  let q = admin.from('bookings').select(
    'id, booking_status, payment_status, pickup_date, return_date, total_rupees, amount_paid, amount_due, user_id, vehicle_id, created_at',
  )
  q = applyDateRange(q, 'created_at', range).is('deleted_at', null).order('created_at', { ascending: false }).limit(10000)

  const { data, error } = await q
  if (error) {
    logPostgrestError('[export] bookings', error)
    return { columns: BOOKING_EXPORT_COLUMNS, rows: [], sheetName: 'Bookings' }
  }

  const rows: ExportRow[] = (data ?? []).map((r) => ({
    id: r.id,
    booking_status: r.booking_status,
    payment_status: r.payment_status,
    pickup_date: r.pickup_date,
    return_date: r.return_date,
    total_rupees: r.total_rupees,
    amount_paid: r.amount_paid,
    amount_due: r.amount_due,
    user_id: r.user_id,
    vehicle_id: r.vehicle_id ?? '',
    created_at: r.created_at,
  }))

  return { columns: BOOKING_EXPORT_COLUMNS, rows, sheetName: 'Bookings' }
}

async function fetchPaymentsExport(range: ExportDateRange) {
  const admin = createAdminClient()
  const columns: ExportColumn[] = [
    { key: 'id', header: 'Event ID' },
    { key: 'booking_id', header: 'Booking ID' },
    { key: 'title', header: 'Title' },
    { key: 'amount_rupees', header: 'Amount (INR)' },
    { key: 'direction', header: 'Direction' },
    { key: 'status', header: 'Status' },
    { key: 'created_at', header: 'Created' },
  ]

  let q = admin
    .from('payment_events')
    .select('id, booking_id, title, amount_rupees, direction, status, created_at')
  q = applyDateRange(q, 'created_at', range).order('created_at', { ascending: false }).limit(10000)

  const { data, error } = await q
  if (error) {
    logPostgrestError('[export] payments', error)
    return { columns, rows: [], sheetName: 'Payments' }
  }

  const rows: ExportRow[] = (data ?? []).map((r) => ({
    id: r.id,
    booking_id: r.booking_id ?? '',
    title: r.title,
    amount_rupees: r.amount_rupees,
    direction: r.direction,
    status: r.status,
    created_at: r.created_at,
  }))

  return { columns, rows, sheetName: 'Payments' }
}

async function fetchPendingDuesExport(range: ExportDateRange) {
  const admin = createAdminClient()
  const columns: ExportColumn[] = [
    { key: 'id', header: 'Booking ID' },
    { key: 'booking_status', header: 'Status' },
    { key: 'payment_status', header: 'Payment' },
    { key: 'amount_due', header: 'Due (INR)' },
    { key: 'amount_paid', header: 'Paid (INR)' },
    { key: 'total_rupees', header: 'Total (INR)' },
    { key: 'pickup_date', header: 'Pickup' },
    { key: 'user_id', header: 'Customer ID' },
  ]

  let q = admin
    .from('bookings')
    .select(
      'id, booking_status, payment_status, amount_due, amount_paid, total_rupees, pickup_date, user_id, created_at',
    )
    .is('deleted_at', null)
    .neq('booking_status', 'cancelled')
    .in('payment_status', ['pending', 'partial'])
    .gt('amount_due', 0)

  q = applyDateRange(q, 'created_at', range).order('amount_due', { ascending: false }).limit(5000)

  const { data, error } = await q
  if (error) {
    logPostgrestError('[export] pending-dues', error)
    return { columns, rows: [], sheetName: 'Pending dues' }
  }

  const rows: ExportRow[] = (data ?? []).map((r) => ({
    id: r.id,
    booking_status: r.booking_status,
    payment_status: r.payment_status,
    amount_due: r.amount_due,
    amount_paid: r.amount_paid,
    total_rupees: r.total_rupees,
    pickup_date: r.pickup_date,
    user_id: r.user_id,
  }))

  return { columns, rows, sheetName: 'Pending dues' }
}

async function fetchFleetExport(range: ExportDateRange) {
  const admin = createAdminClient()
  const columns: ExportColumn[] = [
    { key: 'id', header: 'Vehicle ID' },
    { key: 'name', header: 'Name' },
    { key: 'brand', header: 'Brand' },
    { key: 'registration_number', header: 'Registration' },
    { key: 'availability_status', header: 'Ops status' },
    { key: 'available', header: 'Bookable' },
    { key: 'price_per_day', header: 'Daily rate' },
    { key: 'city', header: 'City' },
    { key: 'created_at', header: 'Created' },
  ]

  let q = admin
    .from('vehicles')
    .select('id, name, brand, registration_number, availability_status, available, price_per_day, city, created_at')
    .is('deleted_at', null)
  q = applyDateRange(q, 'created_at', range).order('created_at', { ascending: false }).limit(5000)

  const { data, error } = await q
  if (error) {
    logPostgrestError('[export] fleet', error)
    return { columns, rows: [], sheetName: 'Fleet' }
  }

  const rows: ExportRow[] = (data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    brand: r.brand,
    registration_number: r.registration_number,
    availability_status: r.availability_status ?? '',
    available: r.available === false ? 'No' : 'Yes',
    price_per_day: r.price_per_day,
    city: r.city ?? '',
    created_at: r.created_at,
  }))

  return { columns, rows, sheetName: 'Fleet' }
}

async function fetchPenaltiesExport(range: ExportDateRange) {
  const admin = createAdminClient()
  const columns: ExportColumn[] = [
    { key: 'id', header: 'Violation ID' },
    { key: 'booking_id', header: 'Booking ID' },
    { key: 'violation_type', header: 'Type' },
    { key: 'amount_rupees', header: 'Amount (INR)' },
    { key: 'status', header: 'Status' },
    { key: 'violation_date', header: 'Date' },
    { key: 'created_at', header: 'Created' },
  ]

  let q = admin
    .from('booking_violations')
    .select('id, booking_id, violation_type, amount_rupees, status, violation_date, created_at')
    .is('deleted_at', null)
  q = applyDateRange(q, 'created_at', range).order('created_at', { ascending: false }).limit(5000)

  const { data, error } = await q
  if (error) {
    logPostgrestError('[export] penalties', error)
    return { columns, rows: [], sheetName: 'Penalties' }
  }

  const rows: ExportRow[] = (data ?? []).map((r) => ({
    id: r.id,
    booking_id: r.booking_id,
    violation_type: r.violation_type,
    amount_rupees: r.amount_rupees,
    status: r.status,
    violation_date: r.violation_date,
    created_at: r.created_at,
  }))

  return { columns, rows, sheetName: 'Penalties' }
}

async function fetchKycSummaryExport(range: ExportDateRange) {
  const admin = createAdminClient()
  const columns: ExportColumn[] = [
    { key: 'id', header: 'Document ID' },
    { key: 'user_id', header: 'User ID' },
    { key: 'document_type', header: 'Type' },
    { key: 'status', header: 'Status' },
    { key: 'storage_pinned', header: 'Pinned' },
    { key: 'storage_retention_until', header: 'Retention until' },
    { key: 'created_at', header: 'Submitted' },
    { key: 'reviewed_at', header: 'Reviewed' },
  ]

  let q = admin
    .from('kyc_documents')
    .select('id, user_id, document_type, status, storage_pinned, storage_retention_until, created_at, reviewed_at')
    .is('deleted_at', null)
  q = applyDateRange(q, 'created_at', range).order('created_at', { ascending: false }).limit(5000)

  const { data, error } = await q
  if (error) {
    logPostgrestError('[export] kyc', error)
    return { columns, rows: [], sheetName: 'KYC summary' }
  }

  const rows: ExportRow[] = (data ?? []).map((r) => ({
    id: r.id,
    user_id: r.user_id,
    document_type: r.document_type,
    status: r.status,
    storage_pinned: (r as { storage_pinned?: boolean }).storage_pinned ? 'Yes' : 'No',
    storage_retention_until: (r as { storage_retention_until?: string | null }).storage_retention_until ?? '',
    created_at: r.created_at,
    reviewed_at: r.reviewed_at ?? '',
  }))

  return { columns, rows, sheetName: 'KYC summary' }
}
