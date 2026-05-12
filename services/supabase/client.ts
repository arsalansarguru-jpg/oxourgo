/**
 * Browser Supabase client — wire when `@supabase/ssr` is installed.
 * @see https://supabase.com/docs/guides/auth/server-side/nextjs
 */
export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        '[oxour-go] Supabase env missing: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY',
      )
    }
    return null
  }
  // return createBrowserClient<Database>(url, anon)
  return null
}
