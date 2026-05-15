import type { NotificationRow } from '@/lib/supabase/database.types'

export type NotificationDayGroup = {
  /** Stable sort key YYYY-MM-DD (local) */
  sortKey: string
  /** Human label for section header */
  label: string
  rows: NotificationRow[]
}

function localDayKey(iso: string): string {
  const d = new Date(iso)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function dayHeadingLabel(iso: string): string {
  const d = new Date(iso)
  const startToday = new Date()
  startToday.setHours(0, 0, 0, 0)
  const startThat = new Date(d)
  startThat.setHours(0, 0, 0, 0)
  const diffDays = Math.round((startThat.getTime() - startToday.getTime()) / 86400000)
  if (diffDays === 0) return 'Today'
  if (diffDays === -1) return 'Yesterday'
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })
}

/**
 * Groups notifications for the inbox (newest day first).
 */
export function groupNotificationsByDay(rows: NotificationRow[]): NotificationDayGroup[] {
  const map = new Map<string, NotificationRow[]>()
  for (const r of rows) {
    const key = localDayKey(r.created_at)
    const list = map.get(key) ?? []
    list.push(r)
    map.set(key, list)
  }

  const keys = [...map.keys()].sort((a, b) => (a < b ? 1 : a > b ? -1 : 0))
  return keys.map((sortKey) => {
    const list = map.get(sortKey) ?? []
    const label = list[0] ? dayHeadingLabel(list[0].created_at) : sortKey
    return { sortKey, label, rows: list }
  })
}
