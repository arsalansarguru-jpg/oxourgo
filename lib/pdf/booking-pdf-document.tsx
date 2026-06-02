import { Document, Link, Page, StyleSheet, Text, View } from '@react-pdf/renderer'

import type { BookingPdfPayload } from '@/lib/pdf/booking-payload'
import { formatInrPdf } from '@/lib/pdf/format-inr-pdf'

const ink = '#0a0a0a'
const muted = '#4b5563'
const line = '#e5e7eb'
const faint = '#9ca3af'

const styles = StyleSheet.create({
  page: {
    paddingTop: 28,
    paddingBottom: 28,
    paddingHorizontal: 36,
    fontFamily: 'Helvetica',
    fontSize: 8.5,
    color: ink,
    lineHeight: 1.4,
  },
  brandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: ink,
    paddingBottom: 8,
  },
  brandName: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 20,
    letterSpacing: 0.6,
  },
  brandTag: {
    marginTop: 3,
    fontSize: 8,
    color: muted,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  docLabel: {
    textAlign: 'right',
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  docHint: {
    marginTop: 4,
    textAlign: 'right',
    fontSize: 8,
    color: muted,
  },
  h2: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9.5,
    marginBottom: 6,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3.5,
    borderBottomWidth: 0.5,
    borderBottomColor: line,
  },
  dt: { color: muted, width: '38%' },
  dd: { width: '60%', textAlign: 'right' },
  grid2: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 4,
  },
  col: { flex: 1 },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  priceTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1.5,
    borderTopColor: ink,
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
  },
  foot: {
    marginTop: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: line,
    fontSize: 7.5,
    color: muted,
  },
  mono: { fontFamily: 'Courier' },
})

function fmtWhen(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Asia/Kolkata' }) + ' IST'
  } catch {
    return iso
  }
}

function titleCaseStatus(raw: string): string {
  return raw
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (m) => m.toUpperCase())
}

function docTitle(kind: BookingPdfPayload['docKind']): string {
  switch (kind) {
    case 'confirmation':
      return 'Booking confirmation'
    case 'invoice':
      return 'Rental invoice'
    case 'summary':
      return 'Trip summary'
    default:
      return 'Booking document'
  }
}

function docIntro(kind: BookingPdfPayload['docKind']): string {
  switch (kind) {
    case 'confirmation':
      return 'This confirms your reservation with Oxour Go. Please review trip details, pricing, and deposit terms below.'
    case 'invoice':
      return 'Itemised rental charges for your trip. GST is shown as recorded at booking time.'
    case 'summary':
      return 'A concise record of your trip window, vehicle assignment, and hubs — ideal for travel and expense filing.'
    default:
      return ''
  }
}

export function BookingPdfDocument({ data }: { data: BookingPdfPayload }) {
  const title = docTitle(data.docKind)
  const modelLabel = data.vehicleName.toLowerCase().startsWith(data.vehicleBrand.toLowerCase())
    ? data.vehicleName
    : `${data.vehicleBrand} ${data.vehicleName}`.trim()

  return (
    <Document title={`${data.brandName} · ${title}`} author={data.brandName} subject={data.invoiceRef}>
      <Page size="A4" style={styles.page}>
        <View style={styles.brandRow}>
          <View>
            <Text style={styles.brandName}>{data.brandName}</Text>
            <Text style={styles.brandTag}>{data.brandTagline}</Text>
          </View>
          <View>
            <Text style={styles.docLabel}>{title}</Text>
            <Text style={styles.docHint}>Ref {data.invoiceRef}</Text>
            <Text style={styles.docHint}>Booking ID</Text>
            <Text style={[styles.docHint, styles.mono]}>{data.bookingId}</Text>
          </View>
        </View>

        <Text style={{ fontSize: 8.5, color: muted, marginBottom: 12 }}>{docIntro(data.docKind)}</Text>

        <Text style={styles.h2}>Customer</Text>
        <View style={styles.row}>
          <Text style={styles.dt}>Name</Text>
          <Text style={styles.dd}>{data.customerName?.trim() || '—'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.dt}>Email</Text>
          <Text style={styles.dd}>{data.customerEmail?.trim() || '—'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.dt}>Phone</Text>
          <Text style={styles.dd}>{data.customerPhone?.trim() || '—'}</Text>
        </View>

        <Text style={[styles.h2, { marginTop: 14 }]}>Vehicle</Text>
        <View style={styles.row}>
          <Text style={styles.dt}>Model</Text>
          <Text style={styles.dd}>{modelLabel}</Text>
        </View>
        {data.vehicleReg ? (
          <View style={styles.row}>
            <Text style={styles.dt}>Registration</Text>
            <Text style={[styles.dd, styles.mono]}>{data.vehicleReg}</Text>
          </View>
        ) : null}
        <View style={styles.row}>
          <Text style={styles.dt}>Year / seats</Text>
          <Text style={styles.dd}>
            {data.vehicleYear != null ? String(data.vehicleYear) : '—'} · {data.seats != null ? `${data.seats} seats` : '—'}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.dt}>Transmission / fuel</Text>
          <Text style={styles.dd}>
            {data.transmission || '—'} · {data.fuelType || '—'}
          </Text>
        </View>

        <Text style={[styles.h2, { marginTop: 14 }]}>Trip</Text>
        <View style={styles.grid2}>
          <View style={styles.col}>
            <Text style={{ color: muted, fontSize: 7.5, letterSpacing: 1.2, textTransform: 'uppercase' }}>Pickup</Text>
            <Text style={{ marginTop: 4, fontFamily: 'Helvetica-Bold' }}>{fmtWhen(data.pickupAt)}</Text>
            <Text style={{ marginTop: 2, color: muted }}>{data.pickupLocation}</Text>
          </View>
          <View style={styles.col}>
            <Text style={{ color: muted, fontSize: 7.5, letterSpacing: 1.2, textTransform: 'uppercase' }}>Return</Text>
            <Text style={{ marginTop: 4, fontFamily: 'Helvetica-Bold' }}>{fmtWhen(data.returnAt)}</Text>
            <Text style={{ marginTop: 2, color: muted }}>{data.returnLocation}</Text>
          </View>
        </View>
        <View style={[styles.row, { marginTop: 10 }]}>
          <Text style={styles.dt}>Rental days</Text>
          <Text style={styles.dd}>{String(data.rentalDays)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.dt}>Booking status</Text>
          <Text style={[styles.dd, styles.mono]}>{titleCaseStatus(data.bookingStatus)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.dt}>Payment status</Text>
          <Text style={[styles.dd, styles.mono]}>{titleCaseStatus(data.paymentStatus)}</Text>
        </View>

        <Text style={[styles.h2, { marginTop: 14 }]}>Pricing</Text>
        <View style={styles.priceRow}>
          <Text style={{ color: muted }}>Daily rate (snapshot)</Text>
          <Text style={styles.mono}>{formatInrPdf(data.pricePerDaySnapshot)}</Text>
        </View>
        <View style={styles.priceRow}>
          <Text style={{ color: muted }}>Subtotal ({data.rentalDays} day{data.rentalDays === 1 ? '' : 's'})</Text>
          <Text style={styles.mono}>{formatInrPdf(data.subtotalRupees)}</Text>
        </View>
        <View style={styles.priceRow}>
          <Text style={{ color: muted }}>Convenience fee</Text>
          <Text style={styles.mono}>{formatInrPdf(data.convenienceFeeRupees)}</Text>
        </View>
        <View style={styles.priceRow}>
          <Text style={{ color: muted }}>GST</Text>
          <Text style={styles.mono}>{formatInrPdf(data.gstRupees)}</Text>
        </View>
        <View style={styles.priceTotal}>
          <Text>Total</Text>
          <Text>{formatInrPdf(data.totalRupees)}</Text>
        </View>
        {data.securityDepositRupees != null && data.securityDepositRupees > 0 ? (
          <View style={[styles.row, { marginTop: 8, borderBottomWidth: 0 }]}>
            <Text style={styles.dt}>Refundable security deposit (vehicle)</Text>
            <Text style={[styles.dd, styles.mono]}>{formatInrPdf(data.securityDepositRupees)}</Text>
          </View>
        ) : null}

        <View style={styles.foot}>
          <Text style={{ fontFamily: 'Helvetica-Bold', marginBottom: 4 }}>Support</Text>
          <Text>
            {data.supportPhone} · {data.supportEmail}
          </Text>
          <Text style={{ marginTop: 6, color: faint, fontSize: 7.0 }}>
            Generated {fmtWhen(data.generatedAtIso)} · Documents are informational; the rental agreement and in-app
            booking record prevail in case of discrepancy.
          </Text>
          <Text style={{ marginTop: 4, fontSize: 7.0 }}>
            Terms & conditions:{' '}
            <Link src={data.termsUrl} style={{ color: ink, textDecoration: 'underline' }}>
              {data.termsUrl}
            </Link>
          </Text>
        </View>
      </Page>
    </Document>
  )
}
