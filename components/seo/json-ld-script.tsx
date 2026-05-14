import Script from 'next/script'

import { serializeJsonLd } from '@/lib/seo/serialize-json-ld'

type JsonLdScriptProps = {
  id: string
  data: unknown
  /** Default `lazyOnload` so LCP is not blocked; use `beforeInteractive` for global graph only. */
  strategy?: 'beforeInteractive' | 'afterInteractive' | 'lazyOnload'
}

/** Injects `application/ld+json` for crawlers (safe serialization). */
export function JsonLdScript({ id, data, strategy = 'lazyOnload' }: JsonLdScriptProps) {
  return (
    <Script
      id={id}
      type="application/ld+json"
      strategy={strategy}
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  )
}
