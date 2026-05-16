import Link from 'next/link'
import { BRAND } from '@/constants/brand'

const link = 'text-sm text-muted transition-colors hover:text-soft'

export function Footer() {
  return (
    <footer className="border-t border-stroke bg-carbon-deep">
      <div className="container-app py-12 sm:py-14">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
          <div>
            <p className="text-lg font-semibold tracking-tight text-soft">{BRAND.name}</p>
            <p className="mt-1 text-sm text-muted">{BRAND.tagline}</p>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
              Premium self-drive in Mumbai — verified vehicles, transparent pricing, WhatsApp concierge.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted">Explore</p>
              <ul className="mt-3 space-y-2">
                <li>
                  <Link href="/fleet" className={link}>
                    Fleet
                  </Link>
                </li>
                <li>
                  <Link href="/about" className={link}>
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/support" className={link}>
                    Support
                  </Link>
                </li>
                <li>
                  <Link href="/careers" className={link}>
                    Careers
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted">Legal & contact</p>
              <ul className="mt-3 space-y-2">
                <li>
                  <Link href="/terms" className={link}>
                    Terms
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className={link}>
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link href="/refund" className={link}>
                    Refunds
                  </Link>
                </li>
                <li>
                  <a href={`tel:${BRAND.phoneTel}`} className={link}>
                    {BRAND.phoneDisplay}
                  </a>
                </li>
                <li>
                  <a href={`mailto:${BRAND.email}`} className={link}>
                    {BRAND.email}
                  </a>
                </li>
                <li>
                  <a href={BRAND.whatsapp} target="_blank" rel="noopener noreferrer" className={link}>
                    WhatsApp concierge
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-stroke pt-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {BRAND.name}</p>
          <div className="flex flex-wrap gap-x-5 gap-y-1">
            <Link href="/sitemap" className={link}>
              Sitemap
            </Link>
            <Link href="/accessibility" className={link}>
              Accessibility
            </Link>
            <Link href="/cookies" className={link}>
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
