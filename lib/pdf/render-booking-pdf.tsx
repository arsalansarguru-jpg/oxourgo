import 'server-only'

import React from 'react'
import { pdf } from '@react-pdf/renderer'

import { BookingPdfDocument } from '@/lib/pdf/booking-pdf-document'
import type { BookingPdfPayload } from '@/lib/pdf/booking-payload'

export async function renderBookingPdfBuffer(data: BookingPdfPayload): Promise<Buffer> {
  const instance = pdf(<BookingPdfDocument data={data} />)
  const blob = await instance.toBlob()
  const ab = await blob.arrayBuffer()
  return Buffer.from(ab)
}
