'use server'

import { revalidatePath } from 'next/cache'

import type { AdminActionResult } from '@/lib/admin/actions/types'
import { writeAdminAudit } from '@/lib/admin/audit'
import { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from '@/lib/audit/actions'
import { requirePermissionForAdminAction } from '@/lib/auth/admin-action-auth'
import { adminActionDbFailed } from '@/lib/errors/safe-user-message'
import { runInstrumentedServerAction } from '@/lib/monitoring/instrument-server-action'
import { linkCustomerContactToUser } from '@/lib/whatsapp/contacts'
import { createWhatsAppBooking } from '@/lib/whatsapp/operations/booking-create'
import { getOrCreateWhatsAppConversation } from '@/lib/whatsapp/conversations'
import { upsertCustomerContactByPhone } from '@/lib/whatsapp/contacts'
import { createAdminClient } from '@/lib/supabase/admin'

export async function adminLinkWhatsAppContactToUserAction(
  contactId: string,
  userId: string,
): Promise<AdminActionResult> {
  return runInstrumentedServerAction('adminLinkWhatsAppContactToUserAction', 'admin', async () => {
    const guard = await requirePermissionForAdminAction('customers.write')
    if (!guard.ok) return guard
    const result = await linkCustomerContactToUser(contactId, userId)
    if (!result.ok) return { ok: false, message: result.message }

    await writeAdminAudit({
      actorUserId: guard.session.user.id,
      actorRole: guard.session.appRole,
      action: AUDIT_ACTIONS.whatsappLink,
      entityType: AUDIT_ENTITY_TYPES.whatsapp,
      entityId: contactId,
      metadata: { userId, contactId },
    })

    revalidatePath('/admin/whatsapp')
    revalidatePath('/admin/bookings')
    return { ok: true, message: result.message }
  })
}

export async function adminCreateWhatsAppBookingFromConversationAction(input: {
  conversationId: string
  contactId: string
  vehicleId: string
  pickupAtIso: string
  returnAtIso: string
  pickupLocation: string
  returnLocation: string
  requireKyc?: boolean
}): Promise<AdminActionResult & { bookingId?: string }> {
  return runInstrumentedServerAction('adminCreateWhatsAppBookingFromConversationAction', 'admin', async () => {
    const guard = await requirePermissionForAdminAction('bookings.write')
    if (!guard.ok) return guard

    const admin = createAdminClient()
    const { data: contact, error } = await admin.from('customer_contacts').select('*').eq('id', input.contactId).maybeSingle()

    if (error || !contact) {
      return adminActionDbFailed('Contact not found.')
    }

    const result = await createWhatsAppBooking({
      conversationId: input.conversationId,
      contact,
      vehicleId: input.vehicleId,
      pickupAtIso: input.pickupAtIso,
      returnAtIso: input.returnAtIso,
      pickupLocation: input.pickupLocation,
      returnLocation: input.returnLocation,
      requireKyc: input.requireKyc,
    })

    if (!result.ok) {
      return { ok: false, message: result.message }
    }

    await writeAdminAudit({
      actorUserId: guard.session.user.id,
      actorRole: guard.session.appRole,
      action: AUDIT_ACTIONS.whatsappBooking,
      entityType: AUDIT_ENTITY_TYPES.booking,
      entityId: result.bookingId,
      metadata: {
        bookingId: result.bookingId,
        conversationId: input.conversationId,
        contactId: input.contactId,
        vehicleId: input.vehicleId,
      },
    })

    revalidatePath('/admin/bookings')
    revalidatePath(`/admin/bookings/${result.bookingId}`)
    revalidatePath('/admin/whatsapp')
    return { ok: true, message: 'WhatsApp booking created.', bookingId: result.bookingId }
  })
}

export async function adminEnsureWhatsAppConversationAction(input: {
  phone: string
  fullName?: string
  userId?: string
}): Promise<AdminActionResult & { conversationId?: string; contactId?: string }> {
  return runInstrumentedServerAction('adminEnsureWhatsAppConversationAction', 'admin', async () => {
    const guard = await requirePermissionForAdminAction('bookings.read')
    if (!guard.ok) return guard

    const { contact, error: contactErr } = await upsertCustomerContactByPhone({
      phone: input.phone,
      fullName: input.fullName,
      userId: input.userId,
    })
    if (!contact || contactErr) {
      return { ok: false, message: contactErr ?? 'Could not create contact.' }
    }

    const { conversation, error: convErr } = await getOrCreateWhatsAppConversation({
      customerContactId: contact.id,
    })
    if (!conversation || convErr) {
      return { ok: false, message: convErr ?? 'Could not open conversation.' }
    }

    revalidatePath('/admin/whatsapp')
    return {
      ok: true,
      message: 'Conversation ready.',
      conversationId: conversation.id,
      contactId: contact.id,
    }
  })
}
