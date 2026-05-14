import Link from 'next/link'

import { BUSINESS_EMAIL_PRIMARY } from '@/lib/constants'

/** One-line legal strip for authenticated dashboard routes (G3). */
export function DashboardSlimFooter() {
  return (
    <footer className="border-t border-stroke bg-matte/[0.55] py-4 text-center text-[11px] text-muted backdrop-blur-md supports-[backdrop-filter]:bg-matte/45">
      <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 px-4">
        <span>© 2026 Oxour Go</span>
        <span aria-hidden className="text-silver/50">
          ·
        </span>
        <Link href="/terms" className="text-electric hover:underline">
          Terms
        </Link>
        <span aria-hidden>·</span>
        <Link href="/privacy" className="text-electric hover:underline">
          Privacy
        </Link>
        <span aria-hidden>·</span>
        <Link href="/refund" className="text-electric hover:underline">
          Refund Policy
        </Link>
        <span aria-hidden>·</span>
        <a href={`mailto:${BUSINESS_EMAIL_PRIMARY}`} className="text-electric hover:underline">
          {BUSINESS_EMAIL_PRIMARY}
        </a>
      </p>
    </footer>
  )
}
