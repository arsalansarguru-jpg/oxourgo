/** Build `/admin/fleet` query string. */
export function stringifyFleetQuery(input: {
  add?: string
  page?: number
  per?: number
  q?: string
  avail?: string
  feat?: string
  view?: string
}): string {
  const sp = new URLSearchParams()
  if (input.add === '1') sp.set('add', '1')
  if (input.q?.trim()) sp.set('q', input.q.trim())
  if (input.avail && input.avail !== 'all') sp.set('avail', input.avail)
  if (input.feat && input.feat !== 'all') sp.set('feat', input.feat)
  if (input.view && input.view !== 'grid') sp.set('view', input.view)
  if (input.page != null && input.page > 1) sp.set('page', String(Math.floor(input.page)))
  if (input.per != null && input.per !== 12) sp.set('per', String(input.per))
  const s = sp.toString()
  return s ? `?${s}` : ''
}
