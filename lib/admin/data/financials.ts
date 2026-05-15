import 'server-only'

import {
  buildDeductionsSnapshot,
  penaltyAmountsFromBooking,
  penaltyNotesFromJson,
  resolveDepositAmount,
} from '@/lib/booking/financial'
import type { BookingWithCar } from '@/lib/supabase/database.types'
import { createAdminClient } from '@/lib/supabase/admin'
import { logPostgrestError } from '@/lib/errors/safe-user-message'
import { adminViolationMetrics } from '@/lib/admin/data/violations'

const financialBookingSelect = `
  id,
  user_id,
  vehicle_id,
  pickup_date,
  return_date,
  booking_status,
  deposit_amount,
  deposit_status,
  deposit_held_rupees,
  deposit_received_at,
  deposit_refunded_at,
  deposit_refunded_rupees,
  refund_amount,
  refund_processed_at,
  penalty_total,
  deposit_penalty_total_rupees,
  penalty_late_rupees,
  penalty_fuel_rupees,
  penalty_extra_km_rupees,
  penalty_cleaning_rupees,
  penalty_damage_rupees,
  penalty_traffic_rupees,
  penalty_notes,
  deductions,
  financial_manual_override,
  returned_at,
  completed_at,
  vehicles (
    id,
    name,
    brand,
    security_deposit
  )
`

export type AdminFinancialMetrics = {
  totalDepositsHeldRupees: number
  pendingRefundsCount: number
  pendingRefundsRupees: number
  withheldDepositsCount: number
  withheldDepositsRupees: number
  outstandingFinesRupees: number
  finesCollectedRupees: number
}

export type AdminPenaltyRow = {
  bookingId: string
  customerUserId: string
  vehicleLabel: string
  pickupDate: string
  penaltyTotalRupees: number
  depositStatus: string
  depositAmountRupees: number
  refundableBalanceRupees: number
  bookingStatus: string
  returnedAt: string | null
}

export type AdminBookingFinancialSummary = {
  booking: BookingWithCar
  depositAmountRupees: number
  deductions: ReturnType<typeof buildDeductionsSnapshot>
}

function vehicleLabel(booking: BookingWithCar): string {
  const v = booking.vehicles
  const one = Array.isArray(v) ? v[0] : v
  if (!one) return 'Vehicle'
  return one.name?.trim() || one.brand?.trim() || 'Vehicle'
}

function vehicleSecurityDeposit(booking: BookingWithCar): number {
  const v = booking.vehicles
  const one = Array.isArray(v) ? v[0] : v
  return Number(one?.security_deposit ?? 0)
}

export async function adminFinancialMetrics(): Promise<AdminFinancialMetrics> {
  const admin = createAdminClient()
  const violationMetrics = await adminViolationMetrics()
  const { data, error } = await admin
    .from('bookings')
    .select('deposit_status, deposit_amount, deposit_held_rupees, refund_amount, penalty_total, deposit_penalty_total_rupees')
    .in('deposit_status', ['received', 'partially_refunded', 'withheld'])
    .neq('booking_status', 'cancelled')

  if (error) {
    logPostgrestError('adminFinancialMetrics', error)
    return {
      totalDepositsHeldRupees: 0,
      pendingRefundsCount: 0,
      pendingRefundsRupees: 0,
      withheldDepositsCount: 0,
      withheldDepositsRupees: 0,
      outstandingFinesRupees: violationMetrics.outstandingLiabilitiesRupees,
      finesCollectedRupees: violationMetrics.totalFinesCollectedRupees,
    }
  }

  let totalDepositsHeldRupees = 0
  let pendingRefundsCount = 0
  let pendingRefundsRupees = 0
  let withheldDepositsCount = 0
  let withheldDepositsRupees = 0

  for (const row of data ?? []) {
    const deposit = resolveDepositAmount({
      deposit_amount: row.deposit_amount,
      deposit_held_rupees: row.deposit_held_rupees,
    })

    if (row.deposit_status === 'received' || row.deposit_status === 'partially_refunded') {
      const refundable = Math.max(0, Math.round(row.refund_amount ?? 0))
      totalDepositsHeldRupees += deposit
      if (row.deposit_status === 'received') {
        pendingRefundsCount += 1
        pendingRefundsRupees += refundable > 0 ? refundable : Math.max(0, deposit - (row.deposit_penalty_total_rupees ?? 0))
      }
    }
    if (row.deposit_status === 'withheld') {
      withheldDepositsCount += 1
      withheldDepositsRupees += deposit
    }
  }

  return {
    totalDepositsHeldRupees,
    pendingRefundsCount,
    pendingRefundsRupees,
    withheldDepositsCount,
    withheldDepositsRupees,
    outstandingFinesRupees: violationMetrics.outstandingLiabilitiesRupees,
    finesCollectedRupees: violationMetrics.totalFinesCollectedRupees,
  }
}

export async function adminPenaltyManagementRows(limit = 80): Promise<AdminPenaltyRow[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('bookings')
    .select(financialBookingSelect)
    .gt('penalty_total', 0)
    .order('returned_at', { ascending: false, nullsFirst: false })
    .limit(limit)

  if (error) {
    logPostgrestError('adminPenaltyManagementRows', error)
    return []
  }

  return (data ?? []).map((row) => {
    const booking = row as unknown as BookingWithCar
    const depositAmount = resolveDepositAmount({
      deposit_amount: booking.deposit_amount,
      deposit_held_rupees: booking.deposit_held_rupees,
      vehicle_security_deposit: vehicleSecurityDeposit(booking),
    })
    const snapshot = buildDeductionsSnapshot({
      amounts: penaltyAmountsFromBooking(booking),
      depositAmountRupees: depositAmount,
      depositAppliedRupees: booking.deposit_penalty_total_rupees,
      manualOverride: booking.financial_manual_override,
      notes: penaltyNotesFromJson(booking.penalty_notes),
    })
    return {
      bookingId: booking.id,
      customerUserId: booking.user_id,
      vehicleLabel: vehicleLabel(booking),
      pickupDate: booking.pickup_date,
      penaltyTotalRupees: booking.penalty_total ?? snapshot.penalty_total_rupees,
      depositStatus: booking.deposit_status ?? 'pending',
      depositAmountRupees: depositAmount,
      refundableBalanceRupees: snapshot.refundable_balance_rupees,
      bookingStatus: booking.booking_status,
      returnedAt: booking.returned_at ?? null,
    }
  })
}

export async function adminGetBookingFinancialSummary(bookingId: string): Promise<AdminBookingFinancialSummary | null> {
  const admin = createAdminClient()
  const { data, error } = await admin.from('bookings').select(financialBookingSelect).eq('id', bookingId).maybeSingle()

  if (error || !data) {
    if (error) logPostgrestError('adminGetBookingFinancialSummary', error)
    return null
  }

  const booking = data as unknown as BookingWithCar
  const depositAmount = resolveDepositAmount({
    deposit_amount: booking.deposit_amount,
    deposit_held_rupees: booking.deposit_held_rupees,
    vehicle_security_deposit: vehicleSecurityDeposit(booking),
  })
  const deductions = buildDeductionsSnapshot({
    amounts: penaltyAmountsFromBooking(booking),
    depositAmountRupees: depositAmount,
    depositAppliedRupees: booking.deposit_penalty_total_rupees,
    manualOverride: booking.financial_manual_override,
    notes: penaltyNotesFromJson(booking.penalty_notes),
  })

  return { booking, depositAmountRupees: depositAmount, deductions }
}
