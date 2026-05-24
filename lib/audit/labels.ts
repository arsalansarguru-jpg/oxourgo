import type { LucideIcon } from 'lucide-react'
import {
  AlertTriangle,
  Archive,
  Banknote,
  Ban,
  CarFront,
  CheckCircle2,
  ClipboardList,
  FileCheck,
  FileX,
  HandCoins,
  MessageCircle,
  RefreshCw,
  RotateCcw,
  Shield,
  SlidersHorizontal,
  UserCog,
  Wrench,
  XCircle,
} from 'lucide-react'

import { AUDIT_ACTIONS } from '@/lib/audit/actions'

export type AuditPresentation = {
  title: string
  description?: string
  icon: LucideIcon
  tone: 'default' | 'success' | 'warn' | 'danger' | 'accent'
  category: string
}

const ACTION_MAP: Record<string, Omit<AuditPresentation, 'category'> & { category?: string }> = {
  [AUDIT_ACTIONS.bookingCreated]: { title: 'Booking created', icon: ClipboardList, tone: 'accent', category: 'Bookings' },
  [AUDIT_ACTIONS.bookingApproved]: { title: 'Booking approved', icon: CheckCircle2, tone: 'success', category: 'Bookings' },
  [AUDIT_ACTIONS.bookingRejected]: { title: 'Booking rejected', icon: XCircle, tone: 'danger', category: 'Bookings' },
  [AUDIT_ACTIONS.bookingCancelled]: { title: 'Booking cancelled', icon: Ban, tone: 'warn', category: 'Bookings' },
  [AUDIT_ACTIONS.bookingVehicleSwapped]: { title: 'Vehicle swapped', icon: RefreshCw, tone: 'accent', category: 'Bookings' },
  [AUDIT_ACTIONS.bookingCompleted]: { title: 'Trip completed', icon: CheckCircle2, tone: 'success', category: 'Bookings' },
  [AUDIT_ACTIONS.bookingActive]: { title: 'Trip started', icon: CarFront, tone: 'accent', category: 'Bookings' },
  [AUDIT_ACTIONS.bookingHandover]: { title: 'Vehicle handed over', icon: CarFront, tone: 'default', category: 'Bookings' },
  [AUDIT_ACTIONS.bookingReturn]: { title: 'Vehicle returned', icon: RotateCcw, tone: 'default', category: 'Bookings' },
  [AUDIT_ACTIONS.bookingManualCreate]: { title: 'Manual booking created', icon: SlidersHorizontal, tone: 'accent', category: 'Bookings' },
  [AUDIT_ACTIONS.bookingForceConfirm]: { title: 'Force confirmed', icon: AlertTriangle, tone: 'warn', category: 'Bookings' },
  [AUDIT_ACTIONS.bookingEmergencyCancel]: { title: 'Emergency cancellation', icon: AlertTriangle, tone: 'danger', category: 'Bookings' },
  [AUDIT_ACTIONS.bookingHold]: { title: 'Booking placed on hold', icon: Ban, tone: 'warn', category: 'Bookings' },
  [AUDIT_ACTIONS.bookingHoldRelease]: { title: 'Hold released', icon: CheckCircle2, tone: 'success', category: 'Bookings' },
  [AUDIT_ACTIONS.paymentReceived]: { title: 'Payment received', icon: Banknote, tone: 'success', category: 'Payments' },
  [AUDIT_ACTIONS.paymentRefund]: { title: 'Refund processed', icon: RotateCcw, tone: 'warn', category: 'Payments' },
  [AUDIT_ACTIONS.depositReceived]: { title: 'Deposit received', icon: HandCoins, tone: 'success', category: 'Payments' },
  [AUDIT_ACTIONS.depositReleased]: { title: 'Deposit released', icon: HandCoins, tone: 'default', category: 'Payments' },
  [AUDIT_ACTIONS.depositDeducted]: { title: 'Deposit deducted', icon: HandCoins, tone: 'warn', category: 'Payments' },
  [AUDIT_ACTIONS.penaltyAdded]: { title: 'Penalty added', icon: AlertTriangle, tone: 'danger', category: 'Payments' },
  [AUDIT_ACTIONS.deductionApplied]: { title: 'Deduction applied', icon: Banknote, tone: 'warn', category: 'Payments' },
  [AUDIT_ACTIONS.kycApproved]: { title: 'KYC approved', icon: FileCheck, tone: 'success', category: 'KYC' },
  [AUDIT_ACTIONS.kycRejected]: { title: 'KYC rejected', icon: FileX, tone: 'danger', category: 'KYC' },
  [AUDIT_ACTIONS.kycResubmission]: { title: 'KYC resubmission requested', icon: RefreshCw, tone: 'warn', category: 'KYC' },
  [AUDIT_ACTIONS.fleetUnavailable]: { title: 'Vehicle marked unavailable', icon: CarFront, tone: 'warn', category: 'Fleet' },
  [AUDIT_ACTIONS.fleetMaintenance]: { title: 'Maintenance mode', icon: Wrench, tone: 'warn', category: 'Fleet' },
  [AUDIT_ACTIONS.fleetOverride]: { title: 'Fleet manual override', icon: SlidersHorizontal, tone: 'accent', category: 'Fleet' },
  [AUDIT_ACTIONS.fleetArchived]: { title: 'Fleet archived', icon: Archive, tone: 'warn', category: 'Fleet' },
  [AUDIT_ACTIONS.fleetRestored]: { title: 'Fleet restored', icon: RotateCcw, tone: 'success', category: 'Fleet' },
  [AUDIT_ACTIONS.violationArchived]: { title: 'Violation archived', icon: Archive, tone: 'warn', category: 'Fleet' },
  [AUDIT_ACTIONS.violationRestored]: { title: 'Violation restored', icon: RotateCcw, tone: 'success', category: 'Fleet' },
  [AUDIT_ACTIONS.adminRoleChange]: { title: 'Role changed', icon: UserCog, tone: 'accent', category: 'Admin' },
  [AUDIT_ACTIONS.adminPricingOverride]: { title: 'Pricing override', icon: SlidersHorizontal, tone: 'warn', category: 'Admin' },
  [AUDIT_ACTIONS.adminManualBooking]: { title: 'Manual booking', icon: ClipboardList, tone: 'accent', category: 'Admin' },
  [AUDIT_ACTIONS.adminEmergency]: { title: 'Emergency action', icon: AlertTriangle, tone: 'danger', category: 'Admin' },
  [AUDIT_ACTIONS.adminOpsAlertDismiss]: { title: 'Alert dismissed', icon: Shield, tone: 'default', category: 'Admin' },
  [AUDIT_ACTIONS.whatsappLink]: { title: 'WhatsApp contact linked', icon: MessageCircle, tone: 'default', category: 'WhatsApp' },
  [AUDIT_ACTIONS.whatsappBooking]: { title: 'Booking via WhatsApp', icon: MessageCircle, tone: 'accent', category: 'WhatsApp' },
}

function humanizeAction(action: string): string {
  const parts = action.split(/[.:_]/)
  return parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ')
}

export function getAuditPresentation(action: string, metadata?: Record<string, unknown> | null): AuditPresentation {
  const mapped = ACTION_MAP[action]
  if (mapped) {
    return {
      title: mapped.title,
      description: typeof metadata?.summary === 'string' ? metadata.summary : undefined,
      icon: mapped.icon,
      tone: mapped.tone,
      category: mapped.category ?? 'Activity',
    }
  }

  const legacy = action.startsWith('booking.') || action.includes('booking')
  return {
    title: humanizeAction(action),
    description: typeof metadata?.summary === 'string' ? metadata.summary : undefined,
    icon: legacy ? ClipboardList : Shield,
    tone: 'default',
    category: action.split('.')[0] ? humanizeAction(action.split('.')[0]!) : 'Activity',
  }
}

export function formatAuditValueChange(
  oldValue: unknown,
  newValue: unknown,
): string | null {
  if (oldValue == null && newValue == null) return null

  // Format utility
  const formatVal = (k: string, v: unknown) => {
    if (v == null) return 'none'
    const keyLower = k.toLowerCase()
    if (
      keyLower.includes('amount') ||
      keyLower.includes('price') ||
      keyLower.includes('rupees') ||
      keyLower.includes('fee') ||
      keyLower.includes('deposit') ||
      keyLower.includes('total') ||
      keyLower.includes('fine') ||
      keyLower.includes('penalty') ||
      keyLower.includes('due') ||
      keyLower.includes('paid')
    ) {
      if (typeof v === 'number') return `₹${v.toLocaleString('en-IN')}`
      if (typeof v === 'string' && !isNaN(Number(v))) return `₹${Number(v).toLocaleString('en-IN')}`
    }
    if (v === true) return 'yes'
    if (v === false) return 'no'
    if (typeof v === 'object') {
      try {
        return JSON.stringify(v)
      } catch {
        return String(v)
      }
    }
    return String(v)
  }

  // If both are non-null objects and not arrays, diff their properties
  if (
    oldValue != null &&
    newValue != null &&
    typeof oldValue === 'object' &&
    typeof newValue === 'object' &&
    !Array.isArray(oldValue) &&
    !Array.isArray(newValue)
  ) {
    const oldObj = oldValue as Record<string, unknown>
    const newObj = newValue as Record<string, unknown>
    const keys = [...new Set([...Object.keys(oldObj), ...Object.keys(newObj)])]
    const changes: string[] = []

    for (const key of keys) {
      const oldVal = oldObj[key]
      const newVal = newObj[key]
      if (oldVal !== newVal) {
        const humanKey = key.replace(/_/g, ' ')
        const titleCaseKey = humanKey.charAt(0).toUpperCase() + humanKey.slice(1)
        if (oldVal == null) {
          changes.push(`${titleCaseKey} set to ${formatVal(key, newVal)}`)
        } else if (newVal == null) {
          changes.push(`${titleCaseKey} cleared (was ${formatVal(key, oldVal)})`)
        } else {
          changes.push(`${titleCaseKey} updated to ${formatVal(key, newVal)}`)
        }
      }
    }
    if (changes.length > 0) {
      return changes.join(', ')
    }
  }

  // If oldValue is null/undefined and newValue is an object, list its non-null entries
  if (oldValue == null && newValue != null && typeof newValue === 'object' && !Array.isArray(newValue)) {
    const newObj = newValue as Record<string, unknown>
    const entries = Object.entries(newObj).filter(([, v]) => v != null)
    if (entries.length > 0) {
      return entries
        .map(([k, v]) => {
          const humanKey = k.replace(/_/g, ' ')
          const titleCaseKey = humanKey.charAt(0).toUpperCase() + humanKey.slice(1)
          return `${titleCaseKey}: ${formatVal(k, v)}`
        })
        .join(', ')
    }
  }

  // Fallback for simple scalar types
  const fmt = (v: unknown) => {
    if (v == null) return '—'
    if (typeof v === 'string') return v
    if (typeof v === 'number' || typeof v === 'boolean') return String(v)
    try {
      return JSON.stringify(v)
    } catch {
      return String(v)
    }
  }

  if (oldValue != null && newValue != null) return `${fmt(oldValue)} → ${fmt(newValue)}`
  if (newValue != null) return fmt(newValue)
  return fmt(oldValue)
}
