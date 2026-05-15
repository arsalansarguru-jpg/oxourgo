import 'server-only'

import * as React from 'react'

import { BRAND } from '@/constants/brand'
import { getVehicleInquiryWhatsAppUrl } from '@/lib/business-contact'
import { getPublicSiteUrl } from '@/lib/env/site-url'
import {
  CustomerBookingApprovedEmail,
  CustomerBookingConfirmationEmail,
  CustomerBookingRejectedEmail,
  CustomerInvoiceAttachedEmail,
  CustomerReturnReminderEmail,
  CustomerTripCompletedEmail,
  CustomerTripReminderEmail,
} from '@/lib/email/templates/customer-emails'
import { OpsBookingCancellationEmail, OpsKycSubmissionEmail, OpsNewBookingEmail } from '@/lib/email/templates/ops-emails'
import type { OutboundEmailTemplateKey } from '@/lib/email/template-keys'
import { buildInvoiceRef } from '@/lib/pdf/booking-payload'
import { loadAdminBookingPdfPayload } from '@/lib/pdf/load-booking-payload-for-pdf'
import { renderBookingPdfBuffer } from '@/lib/pdf/render-booking-pdf'
import { bookingPdfFilename } from '@/lib/pdf/booking-pdf-filename'
import { parseOpsAlertEmails } from '@/lib/notifications/channels/outbound-enqueue'
import { adminGetBooking } from '@/lib/admin/data/bookings'
import type { BookingWithCar } from '@/lib/supabase/database.types'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  bookingSupportPrefilledMessage,
  buildWhatsAppPrefilledUrl,
  returnReminderPrefilledMessage,
  tripReminderPrefilledMessage,
} from '@/lib/whatsapp/links'

export type OutboundJobRow = {
  id: string
  template_key: string
  payload: Record<string, unknown>
  to_email: string | null
}

export type ResolvedOutboundEmail = {
  to: string | string[]
  subject: string
  react: React.ReactNode
  attachments?: { filename: string; content: Buffer }[]
}

function fmtWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
  } catch {
    return iso
  }
}

function carLabelFromBooking(row: BookingWithCar): string | null {
  const v = row.vehicles
  if (!v) return null
  const one = Array.isArray(v) ? v[0] : v
  if (!one) return null
  return one.name?.trim() || `${one.brand}`.trim() || null
}

async function getCustomerEmail(admin: ReturnType<typeof createAdminClient>, userId: string): Promise<string | null> {
  try {
    const { data } = await admin.auth.admin.getUserById(userId)
    return data.user?.email?.trim() || null
  } catch {
    return null
  }
}

async function getFirstName(admin: ReturnType<typeof createAdminClient>, userId: string): Promise<string | null> {
  const { data } = await admin.from('profiles').select('full_name').eq('user_id', userId).maybeSingle()
  const full = data?.full_name?.trim()
  if (!full) return null
  return full.split(/\s+/)[0] ?? full
}

async function loadBookingById(bookingId: string): Promise<BookingWithCar | null> {
  return adminGetBooking(bookingId)
}

export async function resolveOutboundEmail(job: OutboundJobRow): Promise<ResolvedOutboundEmail | null> {
  const admin = createAdminClient()
  const site = getPublicSiteUrl().replace(/\/+$/, '')
  const key = job.template_key as OutboundEmailTemplateKey
  const payload = job.payload ?? {}

  const audience = payload.audience as string | undefined
  const userId = payload.user_id as string | undefined
  const bookingId = payload.booking_id as string | undefined
  const note = (payload.note as string | null | undefined) ?? null

  if (audience === 'ops') {
    const opsTo = parseOpsAlertEmails()
    if (!opsTo.length) return null

    if (key === 'ops_kyc_submission') {
      const uid = userId
      if (!uid) return null
      const docType = (payload.document_type as string) ?? 'document'
      const label = docType.replace(/_/g, ' ')
      return {
        to: opsTo,
        subject: `${BRAND.name} Ops · KYC upload (${label})`,
        react: <OpsKycSubmissionEmail documentTypeLabel={label} adminKycUrl={`${site}/admin/kyc/review/${uid}`} />,
      }
    }

    if (!bookingId) return null
    const row = await loadBookingById(bookingId)
    if (!row) return null
    const car = carLabelFromBooking(row)
    const pickupSummary = fmtWhen(row.pickup_date)

    if (key === 'ops_new_booking') {
      return {
        to: opsTo,
        subject: `${BRAND.name} Ops · New booking pending review`,
        react: (
          <OpsNewBookingEmail
            pickupSummary={pickupSummary}
            carLabel={car}
            adminBookingUrl={`${site}/admin/bookings/${bookingId}`}
          />
        ),
      }
    }

    if (key === 'ops_booking_cancellation') {
      return {
        to: opsTo,
        subject: `${BRAND.name} Ops · Booking cancelled`,
        react: (
          <OpsBookingCancellationEmail
            pickupSummary={pickupSummary}
            carLabel={car}
            note={note}
            adminBookingUrl={`${site}/admin/bookings/${bookingId}`}
          />
        ),
      }
    }

    return null
  }

  if (!userId) return null
  const to = await getCustomerEmail(admin, userId)
  if (!to) return null

  const firstName = await getFirstName(admin, userId)

  if (key === 'customer_booking_confirmation') {
    if (!bookingId) return null
    const row = await loadBookingById(bookingId)
    if (!row) return null
    const car = carLabelFromBooking(row)
    const msg = bookingSupportPrefilledMessage({
      bookingId,
      siteUrl: site,
      carLabel: car,
      pickupSummary: fmtWhen(row.pickup_date),
    })
    return {
      to,
      subject: `${BRAND.name} · Reservation received`,
      react: (
        <CustomerBookingConfirmationEmail
          firstName={firstName}
          carLabel={car}
          pickupSummary={fmtWhen(row.pickup_date)}
          dashboardUrl={`${site}/dashboard/bookings/${bookingId}`}
          whatsAppUrl={buildWhatsAppPrefilledUrl(msg)}
        />
      ),
    }
  }

  if (key === 'customer_booking_approved') {
    if (!bookingId) return null
    const row = await loadBookingById(bookingId)
    if (!row) return null
    const car = carLabelFromBooking(row)
    const msg = bookingSupportPrefilledMessage({
      bookingId,
      siteUrl: site,
      carLabel: car,
      pickupSummary: fmtWhen(row.pickup_date),
    })
    return {
      to,
      subject: `${BRAND.name} · Trip approved`,
      react: (
        <CustomerBookingApprovedEmail
          firstName={firstName}
          carLabel={car}
          pickupSummary={fmtWhen(row.pickup_date)}
          dashboardUrl={`${site}/dashboard/bookings/${bookingId}`}
          whatsAppUrl={buildWhatsAppPrefilledUrl(msg)}
        />
      ),
    }
  }

  if (key === 'customer_booking_rejected') {
    if (!bookingId) return null
    const row = await loadBookingById(bookingId)
    if (!row) return null
    const car = carLabelFromBooking(row)
    return {
      to,
      subject: `${BRAND.name} · Booking update`,
      react: (
        <CustomerBookingRejectedEmail
          firstName={firstName}
          carLabel={car}
          note={note}
          fleetUrl={`${site}/fleet`}
          whatsAppUrl={getVehicleInquiryWhatsAppUrl(car ? { vehicleName: car } : undefined)}
        />
      ),
    }
  }

  if (key === 'customer_trip_reminder') {
    if (!bookingId) return null
    const row = await loadBookingById(bookingId)
    if (!row) return null
    const car = carLabelFromBooking(row) || 'your vehicle'
    const whenSummary = fmtWhen(row.pickup_date)
    const msg = tripReminderPrefilledMessage({
      bookingId,
      siteUrl: site,
      carLabel: car,
      whenSummary,
    })
    return {
      to,
      subject: `${BRAND.name} · Pickup reminder`,
      react: (
        <CustomerTripReminderEmail
          firstName={firstName}
          carLabel={car}
          whenSummary={whenSummary}
          dashboardUrl={`${site}/dashboard/bookings/${bookingId}`}
          whatsAppUrl={buildWhatsAppPrefilledUrl(msg)}
        />
      ),
    }
  }

  if (key === 'customer_return_reminder') {
    if (!bookingId) return null
    const row = await loadBookingById(bookingId)
    if (!row) return null
    const car = carLabelFromBooking(row) || 'your vehicle'
    const returnSummary = fmtWhen(row.return_date)
    const msg = returnReminderPrefilledMessage({
      bookingId,
      siteUrl: site,
      carLabel: car,
      returnSummary,
    })
    return {
      to,
      subject: `${BRAND.name} · Return reminder`,
      react: (
        <CustomerReturnReminderEmail
          firstName={firstName}
          carLabel={car}
          returnSummary={returnSummary}
          dashboardUrl={`${site}/dashboard/bookings/${bookingId}`}
          whatsAppUrl={buildWhatsAppPrefilledUrl(msg)}
        />
      ),
    }
  }

  if (key === 'customer_trip_completed') {
    const dash = bookingId ? `${site}/dashboard/bookings/${bookingId}` : `${site}/dashboard`
    let whatsAppUrl = getVehicleInquiryWhatsAppUrl()
    if (bookingId) {
      const tripRow = await loadBookingById(bookingId)
      const priorCar = tripRow ? carLabelFromBooking(tripRow) : null
      if (priorCar) {
        whatsAppUrl = getVehicleInquiryWhatsAppUrl({ vehicleName: priorCar })
      }
    }
    return {
      to,
      subject: `${BRAND.name} · Trip complete`,
      react: (
        <CustomerTripCompletedEmail firstName={firstName} dashboardUrl={dash} whatsAppUrl={whatsAppUrl} />
      ),
    }
  }

  if (key === 'customer_invoice_attached') {
    if (!bookingId) return null
    const invoiceRef = buildInvoiceRef(bookingId)
    const pdfPayload = await loadAdminBookingPdfPayload(bookingId, 'invoice')
    if (!pdfPayload) return null
    const buffer = await renderBookingPdfBuffer(pdfPayload)
    const filename = bookingPdfFilename(bookingId, 'invoice')
    return {
      to,
      subject: `${BRAND.name} · Invoice ${invoiceRef}`,
      react: (
        <CustomerInvoiceAttachedEmail
          firstName={firstName}
          invoiceRef={invoiceRef}
          dashboardUrl={`${site}/dashboard/bookings/${bookingId}`}
        />
      ),
      attachments: [{ filename, content: buffer }],
    }
  }

  return null
}
