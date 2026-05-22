import { safeRupees } from '@/lib/money/safe'

export function formatInrPdf(amount: unknown): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(safeRupees(amount))
}
