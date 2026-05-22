import { safeRupees } from '@/lib/money/safe'

export function formatInr(amount: unknown) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(safeRupees(amount))
}
