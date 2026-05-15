'use client'

import { Wallet } from 'lucide-react'

import { OnlinePaymentNotice } from '@/components/payments/online-payment-notice'
import type { BookingPaymentMethod } from '@/lib/payments/types'
import { ONLINE_PAYMENTS_COMING_SOON_MESSAGE } from '@/lib/payments/config.public'
import { cn } from '@/lib/utils/cn'

export function PaymentMethodSelector({
  value,
  onChange,
  onlineCheckoutAvailable,
  className,
}: {
  value: BookingPaymentMethod
  onChange: (method: BookingPaymentMethod) => void
  /** From server `isOnlineCheckoutAvailable()` or client `getOnlinePaymentUiState().checkoutAvailable`. */
  onlineCheckoutAvailable: boolean
  className?: string
}) {
  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center gap-2 text-soft">
        <Wallet className="h-5 w-5 text-electric" aria-hidden />
        <h2 className="text-lg font-semibold tracking-[-0.02em]">Payment method</h2>
      </div>
      <p className="text-sm text-muted">
        {onlineCheckoutAvailable
          ? 'Choose how you will settle the rental balance for this reservation.'
          : 'Operational settlement for this reservation.'}
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => onChange('pay_at_pickup')}
          className={cn(
            'rounded-2xl border px-4 py-4 text-left transition-all duration-300',
            value === 'pay_at_pickup'
              ? 'border-electric/50 bg-electric/[0.12] shadow-[0_0_0_1px_rgba(59,130,246,0.35)]'
              : 'border-stroke bg-matte/[0.35] hover:border-stroke-strong',
          )}
        >
          <p className="text-sm font-semibold text-soft">Pay at pickup</p>
          <p className="mt-1 text-xs leading-relaxed text-muted">Settle rental with concierge at the hub before keys.</p>
        </button>

        <button
          type="button"
          disabled={!onlineCheckoutAvailable}
          onClick={() => onlineCheckoutAvailable && onChange('online_payment')}
          className={cn(
            'rounded-2xl border px-4 py-4 text-left transition-all duration-300',
            !onlineCheckoutAvailable && 'cursor-not-allowed opacity-60',
            value === 'online_payment' && onlineCheckoutAvailable
              ? 'border-electric/50 bg-electric/[0.12]'
              : 'border-stroke bg-matte/[0.2]',
          )}
          aria-disabled={!onlineCheckoutAvailable}
        >
          <p className="text-sm font-semibold text-soft">Pay online</p>
          <p className="mt-1 text-xs font-medium uppercase tracking-wide text-muted">
            {onlineCheckoutAvailable ? 'Card / UPI' : ONLINE_PAYMENTS_COMING_SOON_MESSAGE}
          </p>
        </button>
      </div>

      {!onlineCheckoutAvailable ? <OnlinePaymentNotice compact /> : null}
    </div>
  )
}
