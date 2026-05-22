import 'server-only'

import { validateTripWindow } from '@/lib/booking/dates'
import { getPublicSiteUrl } from '@/lib/env/site-url'
import { checkWhatsAppDuplicateBooking } from '@/lib/whatsapp/duplicate-guard'
import { updateWhatsAppConversationState } from '@/lib/whatsapp/conversations'
import type { WhatsAppConversationRow } from '@/lib/whatsapp/conversations'
import type { CustomerContactRow } from '@/lib/whatsapp/contacts'
import { createWhatsAppBooking } from '@/lib/whatsapp/operations/booking-create'
import { checkWhatsAppVehicleAvailability } from '@/lib/whatsapp/operations/availability'
import { getWhatsAppKycStatusForUser } from '@/lib/whatsapp/operations/kyc-prompt'
import { getWhatsAppBookingPaymentSummary } from '@/lib/whatsapp/operations/payment-workflow'
import { suggestVehiclesForWhatsAppWindow } from '@/lib/whatsapp/operations/vehicle-suggest'
import type { WhatsAppConversationContext, WhatsAppFlowState } from '@/lib/whatsapp/types'
import { extractTripSlotsFromText } from '@/lib/whatsapp/flow/extract-slots'
import { fleetCatalogTitle } from '@/lib/admin/fleet-display'
import { notifyOpsWhatsAppBookingCreated } from '@/lib/whatsapp/admin-notify'
import { writeAuditLog } from '@/lib/audit/write'
import { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from '@/lib/audit/actions'

export type FlowEngineInput = {
  conversation: WhatsAppConversationRow
  contact: CustomerContactRow
  customerText: string
  aiExtracted?: {
    pickupAtIso?: string | null
    returnAtIso?: string | null
    pickupLocation?: string | null
    returnLocation?: string | null
    vehicleChoiceIndex?: number | null
    confirmBooking?: boolean | null
  }
}

export type FlowEngineResult = {
  nextFlowState: WhatsAppFlowState
  contextPatch: Partial<WhatsAppConversationContext>
  facts: Record<string, unknown>
  blockingError?: string | null
}

function ctxOf(row: WhatsAppConversationRow): WhatsAppConversationContext {
  return (row.context ?? {}) as WhatsAppConversationContext
}

function mergeSlots(
  ctx: WhatsAppConversationContext,
  heuristic: ReturnType<typeof extractTripSlotsFromText>,
  ai?: FlowEngineInput['aiExtracted'],
): WhatsAppConversationContext {
  return {
    ...ctx,
    pickupAtIso: ai?.pickupAtIso ?? heuristic.pickupAtIso ?? ctx.pickupAtIso,
    returnAtIso: ai?.returnAtIso ?? heuristic.returnAtIso ?? ctx.returnAtIso,
    pickupLocation: ai?.pickupLocation ?? heuristic.pickupLocation ?? ctx.pickupLocation ?? 'Mumbai',
    returnLocation: ai?.returnLocation ?? heuristic.returnLocation ?? ctx.returnLocation ?? 'Mumbai',
    lastCustomerMessage: undefined,
  }
}

export async function runWhatsAppFlowEngine(input: FlowEngineInput): Promise<FlowEngineResult> {
  const state = input.conversation.flow_state as WhatsAppFlowState
  const prev = ctxOf(input.conversation)
  const heuristic = extractTripSlotsFromText(input.customerText)
  const ctx = mergeSlots(prev, heuristic, input.aiExtracted)
  ctx.lastCustomerMessage = input.customerText

  if (state === 'inquiry' || state === 'collecting_dates') {
    const dates = validateTripWindow(ctx.pickupAtIso ?? '', ctx.returnAtIso ?? '')
    if (!ctx.pickupAtIso || !ctx.returnAtIso || !dates.ok) {
      return {
        nextFlowState: 'collecting_dates',
        contextPatch: { ...ctx, notes: input.customerText },
        facts: { needsDates: true, dateError: dates.ok ? null : dates.message },
      }
    }

    const { vehicles, error } = await suggestVehiclesForWhatsAppWindow({
      pickupAtIso: ctx.pickupAtIso,
      returnAtIso: ctx.returnAtIso,
      city: ctx.pickupLocation,
      limit: 5,
    })

    const labels = vehicles.map(
      (v, i) =>
        `${i + 1}. ${fleetCatalogTitle({ id: v.id, name: v.name, brand: v.brand })} — ₹${v.pricePerDay}/day${v.available ? '' : ' (unavailable)'}`,
    )

    return {
      nextFlowState: 'suggesting_vehicle',
      contextPatch: {
        ...ctx,
        suggestedVehicleIds: vehicles.map((v) => v.id),
        suggestedVehicleLabels: labels,
      },
      facts: { vehicles: labels, suggestError: error },
    }
  }

  if (state === 'checking_availability' || state === 'suggesting_vehicle') {
    const idx = (ctx as WhatsAppConversationContext & { vehicleChoiceIndex?: number }).vehicleChoiceIndex
    const choice =
      input.aiExtracted?.vehicleChoiceIndex ?? heuristic.vehicleChoiceIndex ?? idx ?? null

    const ids = ctx.suggestedVehicleIds ?? []
    if (!ids.length) {
      return {
        nextFlowState: 'collecting_dates',
        contextPatch: ctx,
        facts: { needsDates: true },
        blockingError: 'No vehicles in context — need dates first.',
      }
    }

    const selectedIdx = choice != null ? Math.max(1, Math.min(ids.length, Math.round(choice))) - 1 : -1
    if (selectedIdx < 0) {
      return {
        nextFlowState: 'suggesting_vehicle',
        contextPatch: ctx,
        facts: { options: ctx.suggestedVehicleLabels ?? [] },
      }
    }

    const vehicleId = ids[selectedIdx]
    const avail = await checkWhatsAppVehicleAvailability({
      vehicleId,
      pickupAtIso: ctx.pickupAtIso!,
      returnAtIso: ctx.returnAtIso!,
    })

    if (!avail.ok || !avail.available) {
      return {
        nextFlowState: 'suggesting_vehicle',
        contextPatch: { ...ctx, selectedVehicleId: vehicleId },
        facts: { vehicleUnavailable: true, reason: avail.ok ? avail.reason : avail.message },
      }
    }

    return {
      nextFlowState: 'creating_booking',
      contextPatch: { ...ctx, selectedVehicleId: vehicleId },
      facts: { vehicleId, readyToBook: true },
    }
  }

  if (state === 'creating_booking') {
    if (!input.aiExtracted?.confirmBooking && !/\b(confirm|yes|proceed|book)\b/i.test(input.customerText)) {
      return {
        nextFlowState: 'creating_booking',
        contextPatch: ctx,
        facts: { awaitingConfirmation: true, selectedVehicleId: ctx.selectedVehicleId },
      }
    }

    if (!input.contact.user_id) {
      const site = getPublicSiteUrl()
      return {
        nextFlowState: 'creating_booking',
        contextPatch: ctx,
        facts: {
          accountRequired: true,
          signupUrl: `${site}/login`,
        },
        blockingError: 'Customer must link a website account before WhatsApp booking.',
      }
    }

    const vehicleId = ctx.selectedVehicleId
    if (!vehicleId || !ctx.pickupAtIso || !ctx.returnAtIso) {
      return {
        nextFlowState: 'collecting_dates',
        contextPatch: ctx,
        facts: { incomplete: true },
      }
    }

    const dup = await checkWhatsAppDuplicateBooking({
      conversationId: input.conversation.id,
      userId: input.contact.user_id,
      vehicleId,
      pickupAtIso: ctx.pickupAtIso,
      returnAtIso: ctx.returnAtIso,
      excludeBookingId: ctx.draftBookingId ?? null,
    })

    if (!dup.allowed) {
      return {
        nextFlowState: 'payment_workflow',
        contextPatch: {
          ...ctx,
          draftBookingId: dup.existingBookingId,
          duplicateBookingBlockedAt: new Date().toISOString(),
        },
        facts: { duplicateBooking: true, existingBookingId: dup.existingBookingId },
      }
    }

    const created = await createWhatsAppBooking({
      conversationId: input.conversation.id,
      contact: input.contact,
      vehicleId,
      pickupAtIso: ctx.pickupAtIso,
      returnAtIso: ctx.returnAtIso,
      pickupLocation: ctx.pickupLocation ?? 'Mumbai',
      returnLocation: ctx.returnLocation ?? 'Mumbai',
      requireKyc: true,
    })

    if (!created.ok) {
      return {
        nextFlowState: 'creating_booking',
        contextPatch: ctx,
        facts: { bookingError: created.message, code: created.code },
        blockingError: created.message,
      }
    }

    void writeAuditLog({
      entityType: AUDIT_ENTITY_TYPES.whatsapp,
      entityId: input.conversation.id,
      action: AUDIT_ACTIONS.whatsappBooking,
      metadata: { bookingId: created.bookingId, userId: input.contact.user_id },
    })

    void notifyOpsWhatsAppBookingCreated({
      conversationId: input.conversation.id,
      bookingId: created.bookingId,
      contactE164: input.contact.e164,
      totalRupees: created.totalRupees,
    })

    const kyc = await getWhatsAppKycStatusForUser(input.contact.user_id)
    const site = getPublicSiteUrl()
    const kycLink = `${site}/dashboard/kyc`

    if (kyc && !kyc.eligible) {
      return {
        nextFlowState: 'awaiting_kyc',
        contextPatch: {
          ...ctx,
          draftBookingId: created.bookingId,
          kycLinkSentAt: new Date().toISOString(),
        },
        facts: {
          bookingId: created.bookingId,
          totalRupees: created.totalRupees,
          kycStatus: kyc.kycStatus,
          kycLink,
        },
      }
    }

    const payment = await getWhatsAppBookingPaymentSummary(created.bookingId)
    return {
      nextFlowState: 'payment_workflow',
      contextPatch: { ...ctx, draftBookingId: created.bookingId },
      facts: { bookingId: created.bookingId, totalRupees: created.totalRupees, payment },
    }
  }

  if (state === 'awaiting_kyc') {
    const site = getPublicSiteUrl()
    const kycLink = `${site}/dashboard/kyc`
    if (input.contact.user_id) {
      const kyc = await getWhatsAppKycStatusForUser(input.contact.user_id)
      if (kyc?.eligible && ctx.draftBookingId) {
        return {
          nextFlowState: 'payment_workflow',
          contextPatch: ctx,
          facts: { kycApproved: true, bookingId: ctx.draftBookingId },
        }
      }
      return {
        nextFlowState: 'awaiting_kyc',
        contextPatch: { ...ctx, kycLinkSentAt: new Date().toISOString() },
        facts: { kycLink, kycStatus: kyc?.kycStatus },
      }
    }
    return {
      nextFlowState: 'awaiting_kyc',
      contextPatch: ctx,
      facts: { kycLink },
    }
  }

  if (state === 'payment_workflow' || state === 'awaiting_admin_confirmation') {
    const bookingId = ctx.draftBookingId ?? input.conversation.active_booking_id
    if (bookingId) {
      const payment = await getWhatsAppBookingPaymentSummary(bookingId)
      return {
        nextFlowState: state,
        contextPatch: ctx,
        facts: { payment, bookingId },
      }
    }
    return { nextFlowState: state, contextPatch: ctx, facts: {} }
  }

  return {
    nextFlowState: state,
    contextPatch: ctx,
    facts: {},
  }
}

/** Persist flow engine state transition. */
export async function applyFlowEngineResult(
  conversationId: string,
  result: FlowEngineResult,
  activeBookingId?: string | null,
): Promise<void> {
  await updateWhatsAppConversationState({
    conversationId,
    flowState: result.nextFlowState,
    contextPatch: result.contextPatch,
    activeBookingId: activeBookingId ?? undefined,
  })
}
