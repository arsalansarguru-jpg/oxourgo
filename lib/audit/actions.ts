/**
 * Canonical audit action identifiers for Oxour Go.
 * Format: domain.verb (e.g. booking.approved)
 */

export const AUDIT_ACTIONS = {
  // Bookings
  bookingCreated: 'booking.created',
  bookingApproved: 'booking.approved',
  bookingRejected: 'booking.rejected',
  bookingCancelled: 'booking.cancelled',
  bookingVehicleSwapped: 'booking.vehicle_swapped',
  bookingCompleted: 'booking.completed',
  bookingActive: 'booking.active',
  bookingHandover: 'booking.handover',
  bookingReturn: 'booking.return',
  bookingPaymentStatus: 'booking.payment_status',
  bookingNote: 'booking.note',
  bookingHold: 'booking.hold',
  bookingHoldRelease: 'booking.hold_release',
  bookingManualCreate: 'booking.manual_create',
  bookingForceConfirm: 'booking.force_confirm',
  bookingEmergencyCancel: 'booking.emergency_cancel',
  bookingRestrictionsBypass: 'booking.restrictions_bypass',
  bookingDiscount: 'booking.discount',
  bookingPenaltiesWaived: 'booking.penalties_waived',

  // Payments
  paymentReceived: 'payment.received',
  paymentRefund: 'payment.refund',
  paymentPartial: 'payment.partial',
  depositReceived: 'deposit.received',
  depositReleased: 'deposit.released',
  depositDeducted: 'deposit.deducted',
  penaltyAdded: 'penalty.added',
  penaltyWaived: 'penalty.waived',
  deductionApplied: 'deduction.applied',

  // KYC
  kycApproved: 'kyc.approved',
  kycRejected: 'kyc.rejected',
  kycResubmission: 'kyc.resubmission_requested',

  // Fleet
  fleetUnavailable: 'fleet.unavailable',
  fleetMaintenance: 'fleet.maintenance',
  fleetOverride: 'fleet.override',
  fleetCreated: 'fleet.created',
  fleetUpdated: 'fleet.updated',
  fleetDeleted: 'fleet.deleted',
  fleetArchived: 'fleet.archived',
  fleetRestored: 'fleet.restored',
  violationArchived: 'violation.archived',
  violationRestored: 'violation.restored',

  // Admin
  adminRoleChange: 'admin.role_change',
  adminPricingOverride: 'admin.pricing_override',
  adminManualBooking: 'admin.manual_booking',
  adminEmergency: 'admin.emergency',
  adminUserInvite: 'admin.user_invite',
  adminUserDeactivate: 'admin.user_deactivate',
  adminOpsAlertDismiss: 'admin.ops_alert_dismiss',

  // Inspection / violations (cross-domain)
  inspectionEvent: 'inspection.event',
  violationEvent: 'violation.event',

  // WhatsApp ops
  whatsappLink: 'whatsapp.contact_linked',
  whatsappBooking: 'whatsapp.booking_created',
} as const

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS] | string

export const AUDIT_ENTITY_TYPES = {
  booking: 'booking',
  payment: 'payment',
  deposit: 'deposit',
  profile: 'profile',
  kyc: 'kyc',
  vehicle: 'vehicle',
  fleet: 'fleet',
  user: 'user',
  violation: 'violation',
  inspection: 'inspection',
  alert: 'alert',
  whatsapp: 'whatsapp',
} as const

export type AuditEntityType = (typeof AUDIT_ENTITY_TYPES)[keyof typeof AUDIT_ENTITY_TYPES] | string
