import type { Metadata } from 'next'
import { headers } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { SupabaseBrowserCheck } from '@/components/dev/supabase-browser-check'
import { Section, SectionHeading } from '@/components/ui/Section'
import { isSupabaseDiagnosticRouteAllowed } from '@/lib/dev/allow-supabase-diagnostic-route'
import { readSupabasePublicEnv } from '@/lib/env/supabase-public'
import { createClient } from '@/lib/supabase/server'

import { buildPageMetadata } from '@/lib/seo/build-page-metadata'

export const metadata: Metadata = buildPageMetadata({
  title: 'Supabase connection test',
  description: 'Internal diagnostics for Supabase URL, keys, and SSR/browser clients.',
  path: '/supabase-test',
  robots: { index: false, follow: false },
})

function maskKey(key: string) {
  if (key.length <= 14) return '••••••••'
  return `${key.slice(0, 10)}…${key.slice(-4)}`
}

async function probePostgREST(url: string, anonKey: string) {
  try {
    const res = await fetch(`${url}/rest/v1/`, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
      cache: 'no-store',
    })
    const text = await res.text()
    const preview = text.length > 200 ? `${text.slice(0, 200)}…` : text
    return {
      ok: res.ok,
      status: res.status,
      statusText: res.statusText,
      bodyPreview: preview || '(empty body)',
    }
  } catch (e) {
    return { ok: false, error: String(e) }
  }
}

async function probeServerClient() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.getClaims()
    if (error) {
      return { ok: false, error: error.message, code: error.code }
    }
    return {
      ok: true,
      hasClaims: Boolean(data?.claims),
    }
  } catch (e) {
    return { ok: false, error: String(e) }
  }
}

export default async function SupabaseTestPage() {
  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? ''
  if (!isSupabaseDiagnosticRouteAllowed(host)) {
    notFound()
  }

  const env = readSupabasePublicEnv()

  let postgrest: Awaited<ReturnType<typeof probePostgREST>> | null = null
  let serverClient: Awaited<ReturnType<typeof probeServerClient>> | null = null

  if (env) {
    ;[postgrest, serverClient] = await Promise.all([probePostgREST(env.url, env.anonKey), probeServerClient()])
  }

  return (
    <Section>
      <SectionHeading
        eyebrow="Diagnostics"
        title="Supabase connection"
        subtitle="Development and local use only. Gated in production unless an operator enables the documented server flag."
      />

      <div className="mx-auto flex max-w-2xl flex-col gap-8 text-left">
        {!env ? (
          <div className="rounded-2xl border border-amber-500/25 bg-amber-500/[0.06] p-5 text-sm text-soft">
            <p className="font-semibold text-amber-200/95">Configuration missing</p>
            <p className="mt-2 text-muted">
              Set <code className="text-soft/90">NEXT_PUBLIC_SUPABASE_URL</code> and{' '}
              <code className="text-soft/90">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> (or{' '}
              <code className="text-soft/90">NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code>) in{' '}
              <code className="text-soft/90">.env.local</code>. See <code className="text-soft/90">.env.example</code>.
            </p>
          </div>
        ) : (
          <>
            <div className="rounded-2xl border border-stroke bg-carbon-deep/80 p-5 text-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">Resolved public config</p>
              <dl className="mt-4 space-y-2 text-muted">
                <div>
                  <dt className="text-[11px] uppercase tracking-wider text-muted/80">Project URL</dt>
                  <dd className="mt-1 font-mono text-[13px] text-soft">{env.url}</dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-wider text-muted/80">Public API key</dt>
                  <dd className="mt-1 font-mono text-[13px] text-soft">{maskKey(env.anonKey)}</dd>
                </div>
              </dl>
            </div>

            <div className="rounded-2xl border border-stroke bg-carbon-deep/80 p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">1. PostgREST (HTTP)</p>
              <p className="mt-2 text-sm text-muted">
                GET <span className="font-mono text-[12px] text-soft/90">/rest/v1/</span> with anon credentials.
              </p>
              <pre className="mt-4 max-h-48 overflow-auto rounded-xl border border-stroke bg-matte/80 p-4 text-left text-[12px] leading-relaxed text-muted">
                {JSON.stringify(postgrest, null, 2)}
              </pre>
              {postgrest && 'ok' in postgrest && postgrest.ok ? (
                <p className="mt-3 text-sm font-medium text-emerald-400/90">Reachable — API accepted the key.</p>
              ) : null}
            </div>

            <div className="rounded-2xl border border-stroke bg-carbon-deep/80 p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
                2. Server client (<code className="text-soft/90">@/lib/supabase/server</code>)
              </p>
              <p className="mt-2 text-sm text-muted">
                <code className="text-[12px] text-soft/90">createClient()</code> +{' '}
                <code className="text-[12px] text-soft/90">auth.getClaims()</code>
              </p>
              <pre className="mt-4 max-h-48 overflow-auto rounded-xl border border-stroke bg-matte/80 p-4 text-left text-[12px] leading-relaxed text-muted">
                {JSON.stringify(serverClient, null, 2)}
              </pre>
              {serverClient && 'ok' in serverClient && serverClient.ok ? (
                <p className="mt-3 text-sm font-medium text-emerald-400/90">Server client initialized successfully.</p>
              ) : null}
            </div>

            <div className="rounded-2xl border border-stroke bg-carbon-deep/80 p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
                3. Browser client (<code className="text-soft/90">useSupabase</code>)
              </p>
              <p className="mt-2 text-sm text-muted">Runs in the browser after hydration.</p>
              <div className="mt-4">
                <SupabaseBrowserCheck />
              </div>
            </div>
          </>
        )}

        <p className="text-center text-sm text-muted">
          <Link href="/" className="text-electric hover:underline">
            Back to home
          </Link>
        </p>
      </div>
    </Section>
  )
}
