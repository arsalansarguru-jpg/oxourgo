/** Short local date/time for booking summary (luxury UI, no raw ISO). */
export function formatTripDateTime(isoOrLocal: string): string {
  const d = new Date(isoOrLocal)
  if (!Number.isFinite(d.getTime())) return '—'
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}
