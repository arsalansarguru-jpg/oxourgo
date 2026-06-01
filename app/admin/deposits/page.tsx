import { redirect } from 'next/navigation'

/** Legacy URL — bookmarks and external links used /admin/deposits before /admin/financials. */
export default async function AdminDepositsRedirectPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const q = await searchParams
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(q)) {
    if (typeof value === 'string') params.set(key, value)
    else if (Array.isArray(value)) value.forEach((v) => params.append(key, v))
  }
  const qs = params.toString()
  redirect(qs ? `/admin/financials?${qs}` : '/admin/financials')
}
