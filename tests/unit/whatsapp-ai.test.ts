import { describe, expect, it } from 'vitest'

import { extractTripSlotsFromText } from '@/lib/whatsapp/flow/extract-slots'
import { isConversationEscalated } from '@/lib/whatsapp/escalation'

describe('extractTripSlotsFromText', () => {
  it('parses day-month range', () => {
    const slots = extractTripSlotsFromText('20 May 10:00 to 22 May 10:00 from Mumbai')
    expect(slots.pickupAtIso).toBeDefined()
    expect(slots.returnAtIso).toBeDefined()
    expect(slots.pickupLocation).toMatch(/mumbai/i)
  })

  it('parses vehicle option number', () => {
    const slots = extractTripSlotsFromText('option 2')
    expect(slots.vehicleChoiceIndex).toBe(2)
  })
})

describe('isConversationEscalated', () => {
  it('detects paused or escalated_at', () => {
    expect(isConversationEscalated({ status: 'paused', escalated_at: null })).toBe(true)
    expect(isConversationEscalated({ status: 'active', escalated_at: '2026-01-01T00:00:00Z' })).toBe(true)
    expect(isConversationEscalated({ status: 'active', escalated_at: null })).toBe(false)
  })
})
