/** Absolute site origin for links inside server-generated PDFs and emails. */
export function getPublicSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (fromEnv) return fromEnv.replace(/\/+$/, '')
  const vercel = process.env.VERCEL_URL?.trim()
  if (vercel) return `https://${vercel.replace(/\/+$/, '')}`
  return 'http://localhost:3000'
}
