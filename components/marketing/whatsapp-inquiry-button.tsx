'use client'

import { MessageCircle } from 'lucide-react'
import type { ComponentProps } from 'react'

import { Button } from '@/components/ui/Button'
import { getBusinessWhatsAppUrl, getVehicleInquiryWhatsAppUrl, type VehicleInquiryContext } from '@/lib/business-contact'
import { cn } from '@/lib/utils/cn'

type WhatsAppInquiryButtonProps = Omit<ComponentProps<typeof Button>, 'href' | 'to'> & {
  vehicle?: VehicleInquiryContext
  prefillText?: string
  label?: string
  /** When false, hides the default WhatsApp glyph (use for typographic / editorial CTAs). */
  showIcon?: boolean
}

/** Opens WhatsApp concierge with a contextual prefill (inquiry-only soft launch). */
export function WhatsAppInquiryButton({
  vehicle,
  prefillText,
  label = 'Book on WhatsApp',
  showIcon = true,
  className,
  children,
  ...props
}: WhatsAppInquiryButtonProps) {
  const href = vehicle
    ? getVehicleInquiryWhatsAppUrl(vehicle)
    : getBusinessWhatsAppUrl(prefillText)

  const { onClick, ...buttonProps } = props

  return (
    <Button
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(showIcon && 'gap-2', className)}
      onClick={onClick}
      {...buttonProps}
    >
      {showIcon ? <MessageCircle className="h-4 w-4 shrink-0" aria-hidden /> : null}
      {children ?? label}
    </Button>
  )
}
