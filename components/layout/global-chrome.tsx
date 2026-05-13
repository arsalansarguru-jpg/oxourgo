'use client'

import { FloatingWhatsApp } from '@/components/layout/floating-whatsapp'

/** App-wide floating actions (outside route layouts so admin still gets WhatsApp). */
export function GlobalChrome() {
  return <FloatingWhatsApp />
}
