import type { HelpArticle } from '@/lib/admin/help-center/types'

/** Canonical operational SOPs for Oxour Go admin staff. */
export const HELP_ARTICLES: HelpArticle[] = [
  {
    slug: 'booking-operations',
    title: 'Booking Operations',
    description: 'End-to-end handling of reservations from pending payment through completion or cancellation.',
    category: 'operations',
    roles: 'all',
    keywords: ['booking', 'confirm', 'cancel', 'pending', 'lifecycle', 'manual', 'whatsapp'],
    estimatedMinutes: 12,
    sections: [
      {
        id: 'overview',
        title: 'Overview',
        body:
          'Bookings move through: pending_payment → confirmed → active (on trip) → completed, or cancelled. Use Admin → Bookings for the pipeline and Admin → Operations for manual overrides, holds, and VIP flags.',
      },
      {
        id: 'intake',
        title: 'New booking intake',
        body:
          '1. Open Admin → Bookings and filter by pending_payment.\n2. Verify vehicle availability and date overlap on the booking detail page.\n3. Confirm customer KYC status is approved before handover (see KYC SOP).\n4. For WhatsApp-sourced bookings, check Admin → WhatsApp for conversation context.',
      },
      {
        id: 'confirm',
        title: 'Confirming a booking',
        body:
          'From booking detail → Operations workflow: approve when payment terms are clear. If payment is still pending, use Payments SOP before marking handed over. Ops admins may force-confirm only with documented reason (audit logged).',
      },
      {
        id: 'holds',
        title: 'Ops holds & manual bookings',
        body:
          'Place a booking on hold from Operations → Manual ops when fraud, overlap, or documentation is incomplete. Release hold only after resolution. Manual bookings (admin_manual source) require extra verification on pricing and customer identity.',
      },
      {
        id: 'cancel',
        title: 'Cancellations',
        body:
          'Standard cancel: use booking workflow when customer withdraws before trip. Emergency cancel (ops_admin only): for safety or fraud — always add an internal note. Never delete booking rows; status becomes cancelled and remains in audit history.',
      },
    ],
    checklist: [
      { id: 'b1', label: 'Verify dates, vehicle, and customer profile', critical: true },
      { id: 'b2', label: 'Check KYC approved before handover', critical: true },
      { id: 'b3', label: 'Confirm payment status matches policy', critical: true },
      { id: 'b4', label: 'Log internal note for any override or hold' },
      { id: 'b5', label: 'Revalidate fleet availability after vehicle swap' },
    ],
    relatedLinks: [
      { label: 'Bookings', href: '/admin/bookings' },
      { label: 'Operations', href: '/admin/operations' },
      { label: 'Command center', href: '/admin' },
    ],
  },
  {
    slug: 'kyc-verification',
    title: 'KYC Verification',
    description: 'Review identity documents, approve or reject with audit trail, and manage resubmissions.',
    category: 'compliance',
    roles: ['kyc_reviewer', 'ops_admin', 'support_agent', 'fleet_manager', 'finance_manager'],
    keywords: ['kyc', 'aadhaar', 'license', 'passport', 'pan', 'selfie', 'approve', 'reject'],
    estimatedMinutes: 10,
    sections: [
      {
        id: 'queue',
        title: 'Queue management',
        body:
          'Admin → KYC lists customers with pending or reviewing documents. Open a row to review all document types for that user. Work oldest submissions first unless VIP or same-day pickup flagged.',
      },
      {
        id: 'review',
        title: 'Document review standards',
        body:
          'Match name across documents, check expiry on licence/passport, ensure selfie matches ID, verify PAN when required for high-value rentals. Reject with clear rejection_reason — customer sees this in dashboard.',
      },
      {
        id: 'decision',
        title: 'Approve / reject / resubmission',
        body:
          'Approve: sets profile KYC to approved; documents are storage-pinned for retention. Reject: customer must re-upload. Resubmission required: use when single document is unclear but customer is otherwise valid.',
      },
      {
        id: 'escalation',
        title: 'Escalation',
        body:
          'Fraud suspicion → reject and flag customer in booking manual ops (customer_flags). Same-day pickup pressure → escalate to ops_admin; do not approve incomplete sets.',
      },
    ],
    checklist: [
      { id: 'k1', label: 'All required document types present', critical: true },
      { id: 'k2', label: 'Images legible and unedited', critical: true },
      { id: 'k3', label: 'Identity matches booking customer', critical: true },
      { id: 'k4', label: 'Rejection reason written in plain language' },
      { id: 'k5', label: 'Audit trail shows your reviewer ID' },
    ],
    relatedLinks: [
      { label: 'KYC queue', href: '/admin/kyc' },
      { label: 'Customers', href: '/admin/customers' },
    ],
  },
  {
    slug: 'payment-collection',
    title: 'Payment Collection',
    description: 'Record rental payments, partial collections, and reconcile open balances.',
    category: 'finance',
    roles: ['finance_manager', 'ops_admin', 'support_agent'],
    keywords: ['payment', 'received', 'partial', 'due', 'ledger', 'razorpay'],
    estimatedMinutes: 10,
    sections: [
      {
        id: 'board',
        title: 'Payments board',
        body:
          'Admin → Payments shows bookings with pending or partial payment_status. Cross-check amount_due vs amount_paid on booking detail before recording.',
      },
      {
        id: 'record',
        title: 'Marking payment received',
        body:
          'From booking detail → payment panel: mark full or partial receipt with amount and notes. System writes payment_events ledger rows. For gateway payments (when live), verify webhook status before manual duplicate entry.',
      },
      {
        id: 'partial',
        title: 'Partial payments',
        body:
          'Allowed when contract permits (e.g. deposit + balance at pickup). Always set accurate amount_paid; amount_due should reflect remainder. Finance manager approves write-offs.',
      },
      {
        id: 'disputes',
        title: 'Disputes',
        body:
          'Do not delete payment events. Void incorrect entries via finance workflow and add corrective event. Escalate chargebacks to ops_admin + finance.',
      },
    ],
    checklist: [
      { id: 'p1', label: 'Booking ID and customer verified', critical: true },
      { id: 'p2', label: 'Amount matches agreed contract', critical: true },
      { id: 'p3', label: 'Payment method noted (cash/UPI/bank/gateway)' },
      { id: 'p4', label: 'Ledger event visible on booking timeline' },
    ],
    relatedLinks: [
      { label: 'Payments', href: '/admin/payments' },
      { label: 'Bookings', href: '/admin/bookings' },
    ],
  },
  {
    slug: 'deposit-refund',
    title: 'Deposit & Refund',
    description: 'Hold security deposits, apply deductions, and process refunds after return.',
    category: 'finance',
    roles: ['finance_manager', 'ops_admin'],
    keywords: ['deposit', 'refund', 'withhold', 'deduction', 'penalty', 'held'],
    estimatedMinutes: 14,
    sections: [
      {
        id: 'deposit',
        title: 'Deposit lifecycle',
        body:
          'Deposit status flows: pending → received → partially_refunded / withheld / released. Amount held is on booking financial panel (Admin → Deposits or booking detail).',
      },
      {
        id: 'return',
        title: 'After vehicle return',
        body:
          'Complete return inspection first. Review penalties and violations. Net refundable = deposit held minus approved deductions. Finance records refund_amount and processes payout.',
      },
      {
        id: 'withhold',
        title: 'Withholding deposit',
        body:
          'Use when damage, fuel, late return, or traffic fines apply. Document each line item on booking financial panel. Customer notification should reference itemized deductions.',
      },
      {
        id: 'refund',
        title: 'Processing refunds',
        body:
          'Mark refund processed only after bank/UPI confirmation. Partial refunds allowed. All changes audit-logged; use Backup & DR exports for reconciliation.',
      },
    ],
    checklist: [
      { id: 'd1', label: 'Return inspection completed', critical: true },
      { id: 'd2', label: 'Violations and penalties reconciled', critical: true },
      { id: 'd3', label: 'Refund amount matches calculation', critical: true },
      { id: 'd4', label: 'Customer notified of outcome' },
    ],
    relatedLinks: [
      { label: 'Deposits & financials', href: '/admin/financials' },
      { label: 'Violations', href: '/admin/violations' },
    ],
  },
  {
    slug: 'vehicle-handover',
    title: 'Vehicle Handover',
    description: 'Pickup inspection, customer signature, and marking the trip active.',
    category: 'fleet',
    roles: ['fleet_manager', 'ops_admin', 'support_agent'],
    keywords: ['handover', 'pickup', 'inspection', 'signature', 'active', 'fuel', 'odometer'],
    estimatedMinutes: 12,
    sections: [
      {
        id: 'prep',
        title: 'Pre-handover',
        body:
          'Confirm booking is confirmed, KYC approved, and payment policy met. Vehicle availability_status should be available; note any fleet_ops_note on vehicle record.',
      },
      {
        id: 'inspection',
        title: 'Pickup inspection',
        body:
          'Booking detail → Inspection workspace: complete photo checklist (exterior, interior, odometer, fuel). Save inspection; mark pickup complete when all slots filled.',
      },
      {
        id: 'signature',
        title: 'Customer acknowledgement',
        body:
          'Capture handover signature on device when available. Records customer_handover_signed_at on booking.',
      },
      {
        id: 'activate',
        title: 'Mark handed over / active',
        body:
          'Operations workflow → Mark handed over. System sets handed_over_at and booking_status active. Vehicle is now on trip — update fleet mental model / utilization dashboards.',
      },
    ],
    checklist: [
      { id: 'h1', label: 'KYC + payment gates passed', critical: true },
      { id: 'h2', label: 'Pickup photos complete', critical: true },
      { id: 'h3', label: 'Fuel and odometer recorded', critical: true },
      { id: 'h4', label: 'Customer walkthrough of vehicle done' },
      { id: 'h5', label: 'Handover action saved in admin', critical: true },
    ],
    relatedLinks: [
      { label: 'Bookings', href: '/admin/bookings' },
      { label: 'Fleet', href: '/admin/fleet' },
    ],
  },
  {
    slug: 'vehicle-return-inspection',
    title: 'Vehicle Return Inspection',
    description: 'Close-out inspection, damage notes, and marking the vehicle returned.',
    category: 'fleet',
    roles: ['fleet_manager', 'ops_admin', 'support_agent'],
    keywords: ['return', 'inspection', 'damage', 'fuel', 'completed', 'checklist'],
    estimatedMinutes: 12,
    sections: [
      {
        id: 'timing',
        title: 'When to inspect',
        body:
          'At contract return date/time or when customer arrives early. Booking must be active. Overdue returns appear on Command center — contact customer before waiving late fees.',
      },
      {
        id: 'walkthrough',
        title: 'Return inspection steps',
        body:
          'Inspection workspace → Return phase: photograph same angles as pickup. Record return fuel and odometer. Note new damage in return_condition_notes and penalties if applicable.',
      },
      {
        id: 'mark-returned',
        title: 'Mark returned',
        body:
          'Operations workflow → Mark returned (sets returned_at). Vehicle still active until completed. Do not skip inspection — required for deposit release.',
      },
      {
        id: 'complete',
        title: 'Complete trip',
        body:
          'After finance clears penalties/deposit path, mark completed. Fleet team sets vehicle back to available or maintenance if issues found.',
      },
    ],
    checklist: [
      { id: 'r1', label: 'Compare pickup vs return photos', critical: true },
      { id: 'r2', label: 'Fuel shortfall documented if any', critical: true },
      { id: 'r3', label: 'Odometer and extra km calculated' },
      { id: 'r4', label: 'Return marked in system', critical: true },
      { id: 'r5', label: 'Maintenance ticket if vehicle not rentable' },
    ],
    relatedLinks: [
      { label: 'Bookings', href: '/admin/bookings' },
      { label: 'Violations', href: '/admin/violations' },
    ],
  },
  {
    slug: 'traffic-fine-management',
    title: 'Traffic Fine Management',
    description: 'Record violations, attach challans, notify customers, and collect or deduct fines.',
    category: 'finance',
    roles: ['finance_manager', 'ops_admin', 'fleet_manager'],
    keywords: ['violation', 'challan', 'traffic', 'fine', 'penalty', 'deduct'],
    estimatedMinutes: 11,
    sections: [
      {
        id: 'create',
        title: 'Creating a violation',
        body:
          'From booking detail → Violations panel: add type (traffic, fuel, damage, etc.), amount, date, and upload challan PDF/image when available.',
      },
      {
        id: 'notify',
        title: 'Customer notification',
        body:
          'Mark customer notified when WhatsApp/email sent. Keep notes field for reference number or police station.',
      },
      {
        id: 'collect',
        title: 'Collection paths',
        body:
          'Paid separately: mark paid with amount. Or deduct from deposit: mark deducted_from_deposit after finance approval. Settled violations cannot be deleted — archive only.',
      },
      {
        id: 'sync',
        title: 'Financial sync',
        body:
          'Violations sync to booking penalty totals and deposit calculations. Re-check financial panel after changes.',
      },
    ],
    checklist: [
      { id: 'v1', label: 'Correct booking and customer linked', critical: true },
      { id: 'v2', label: 'Challan attached when available' },
      { id: 'v3', label: 'Amount matches official challan', critical: true },
      { id: 'v4', label: 'Customer notified' },
      { id: 'v5', label: 'Deposit/financial panel reviewed' },
    ],
    relatedLinks: [
      { label: 'Violations', href: '/admin/violations' },
      { label: 'Deposits', href: '/admin/financials' },
    ],
  },
  {
    slug: 'customer-support',
    title: 'Customer Support',
    description: 'Handle guest inquiries, booking changes, and escalations with consistent tone and logging.',
    category: 'operations',
    roles: ['support_agent', 'ops_admin', 'finance_manager', 'fleet_manager'],
    keywords: ['support', 'customer', 'whatsapp', 'complaint', 'escalation'],
    estimatedMinutes: 9,
    sections: [
      {
        id: 'channels',
        title: 'Channels',
        body:
          'Phone, WhatsApp (Admin → WhatsApp), and email. Always locate customer in Admin → Customers before changing bookings.',
      },
      {
        id: 'triage',
        title: 'Triage',
        body:
          'Classify: booking status, payment, KYC, on-trip emergency, or post-trip financial. Link to the correct SOP before taking action.',
      },
      {
        id: 'changes',
        title: 'Booking changes',
        body:
          'Date or vehicle changes may require repricing and ops approval. Log ops_note on booking. Do not promise refunds — finance decides.',
      },
      {
        id: 'tone',
        title: 'Brand tone',
        body:
          'Luxury, calm, precise. Acknowledge inconvenience. Never share internal role names or raw system errors with customers.',
      },
    ],
    checklist: [
      { id: 's1', label: 'Customer identified in admin', critical: true },
      { id: 's2', label: 'Booking context reviewed' },
      { id: 's3', label: 'Internal note added for actions taken' },
      { id: 's4', label: 'Escalated to ops/finance when outside policy' },
    ],
    relatedLinks: [
      { label: 'Customers', href: '/admin/customers' },
      { label: 'WhatsApp', href: '/admin/whatsapp' },
    ],
  },
  {
    slug: 'emergency-incident',
    title: 'Emergency Incident',
    description: 'Accidents, breakdowns, theft, and safety-critical events requiring immediate ops response.',
    category: 'safety',
    roles: 'all',
    keywords: ['emergency', 'accident', 'breakdown', 'theft', 'safety', 'override'],
    estimatedMinutes: 8,
    incidentNote: 'Life safety first. Call emergency services (112) before admin actions when anyone is injured.',
    sections: [
      {
        id: 'immediate',
        title: 'Immediate actions (first 15 minutes)',
        body:
          '1. Ensure people are safe; call emergency services if injuries or road blockage.\n2. Note GPS, time, and booking ID.\n3. Notify ops_admin on-call channel (your team roster).\n4. Do not admit liability on behalf of Oxour Go.',
      },
      {
        id: 'vehicle',
        title: 'Vehicle & booking flags',
        body:
          'Fleet → set vehicle to accident_hold or maintenance. Booking → emergency cancel or hold via Operations (ops_admin). Preserve inspection photos already uploaded.',
      },
      {
        id: 'documentation',
        title: 'Documentation',
        body:
          'Collect FIR/police report, photos, third-party details. Upload to violation/inspection storage as applicable. Full narrative in admin_internal_notes.',
      },
      {
        id: 'after',
        title: 'After action review',
        body:
          'Within 24h: ops_admin reviews audit log, insurance broker notified per playbook, customer communication draft approved by management.',
      },
    ],
    checklist: [
      { id: 'e1', label: 'Safety secured', critical: true },
      { id: 'e2', label: 'Emergency services contacted if needed', critical: true },
      { id: 'e3', label: 'Ops admin notified', critical: true },
      { id: 'e4', label: 'Vehicle status updated', critical: true },
      { id: 'e5', label: 'Booking hold or emergency cancel applied' },
      { id: 'e6', label: 'Evidence uploaded and notes complete' },
    ],
    relatedLinks: [
      { label: 'Operations', href: '/admin/operations' },
      { label: 'Fleet', href: '/admin/fleet' },
      { label: 'Audit log', href: '/admin/audit' },
    ],
  },
  {
    slug: 'staff-roles-permissions',
    title: 'Staff Roles & Permissions',
    description: 'Who can do what in Oxour Go admin — RBAC reference for all staff roles.',
    category: 'people',
    roles: 'all',
    keywords: ['role', 'permission', 'rbac', 'access', 'finance', 'fleet', 'kyc', 'ops'],
    estimatedMinutes: 7,
    sections: [
      {
        id: 'roles',
        title: 'Role summary',
        body:
          'support_agent: read-mostly across bookings, customers, fleet, KYC view, payments view.\nfleet_manager: fleet write, bookings write, inspections, manual ops, archive vehicles.\nfinance_manager: payments, deposits, refunds, penalties, exports — no fleet delete.\nkyc_reviewer: KYC review queue only + customers read.\nops_admin: full access including overrides, audit, user management.',
      },
      {
        id: 'principle',
        title: 'Principle of least privilege',
        body:
          'Request role changes via Admin → Users (ops_admin only). UI hiding is not security — server always enforces permissions.',
      },
      {
        id: 'forbidden',
        title: 'Never do',
        body:
          'Share your login. Export customer PII to personal devices without approval. Hard-delete vehicles or violations (use archive). Bypass KYC for friends/family.',
      },
      {
        id: 'forbidden-ui',
        title: 'Forbidden page',
        body:
          'If you see Access restricted, your role lacks permission for that URL. Note the path and ask ops_admin to adjust role or process.',
      },
    ],
    checklist: [
      { id: 'rbac1', label: 'Know your assigned role', critical: true },
      { id: 'rbac2', label: 'Use correct SOP for task — do not borrow accounts' },
      { id: 'rbac3', label: 'Report access needs via ops lead' },
    ],
    relatedLinks: [
      { label: 'Users & roles', href: '/admin/users' },
      { label: 'Audit log', href: '/admin/audit' },
    ],
  },
]
