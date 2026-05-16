import Link from 'next/link'
import { BRAND } from '@/constants/brand'

export function Footer() {
  return (
    <footer className="border-t border-stroke/30 bg-matte">
      <div className="container-app py-20 sm:py-24 lg:py-28 xl:py-32 2xl:max-w-[var(--container-wide)]">
        <div className="flex flex-col gap-16 lg:flex-row lg:items-start lg:justify-between lg:gap-12">
          <div className="max-w-xl lg:max-w-[min(100%,28rem)] xl:max-w-lg">
            <p className="text-[clamp(2rem,4.5vw,3.5rem)] font-medium leading-[1.05] tracking-[-0.045em] text-soft">
              {BRAND.name}
            </p>
            <p className="mt-4 text-[11px] font-medium uppercase tracking-[0.3em] text-muted">{BRAND.tagline}</p>
            <p className="mt-10 max-w-md text-[15px] font-normal leading-[1.75] text-muted">
              Premium self-drive in Mumbai — curated cars, transparent tariffs, and a concierge who stays with you
              from first message to handover.
            </p>
            <p className="mt-10 text-[13px] leading-relaxed text-muted">{BRAND.address}</p>
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-14 lg:max-w-md lg:flex-none xl:max-w-lg">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-muted">Discover</p>
              <ul className="mt-6 flex flex-col gap-4">
                <li>
                  <Link href="/fleet" className="text-[15px] font-normal text-soft transition-opacity hover:opacity-65">
                    Fleet
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="text-[15px] font-normal text-soft transition-opacity hover:opacity-65">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/support" className="text-[15px] font-normal text-soft transition-opacity hover:opacity-65">
                    Support
                  </Link>
                </li>
                <li>
                  <Link href="/careers" className="text-[15px] font-normal text-soft transition-opacity hover:opacity-65">
                    Careers
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-muted">Legal &amp; policies</p>
              <ul className="mt-6 flex flex-col gap-3">
                <li>
                  <Link href="/terms" className="text-[14px] text-muted transition-colors hover:text-soft">
                    Terms
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-[14px] text-muted transition-colors hover:text-soft">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link href="/refund" className="text-[14px] text-muted transition-colors hover:text-soft">
                    Refunds
                  </Link>
                </li>
                <li>
                  <Link href="/insurance" className="text-[14px] text-muted transition-colors hover:text-soft">
                    Insurance
                  </Link>
                </li>
                <li>
                  <Link href="/sitemap" className="text-[14px] text-muted transition-colors hover:text-soft">
                    Sitemap
                  </Link>
                </li>
                <li>
                  <Link href="/accessibility" className="text-[14px] text-muted transition-colors hover:text-soft">
                    Accessibility
                  </Link>
                </li>
                <li>
                  <Link href="/cookies" className="text-[14px] text-muted transition-colors hover:text-soft">
                    Cookies
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-muted">Contact</p>
              <div className="mt-6 space-y-4 text-[15px] leading-relaxed">
                <p>
                  <a href={`tel:${BRAND.phoneTel}`} className="text-soft transition-opacity hover:opacity-65">
                    {BRAND.phoneDisplay}
                  </a>
                </p>
                <p>
                  <a href={`mailto:${BRAND.email}`} className="text-soft transition-opacity hover:opacity-65">
                    {BRAND.email}
                  </a>
                </p>
                <p>
                  <a
                    href={BRAND.whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-soft transition-opacity hover:opacity-65"
                  >
                    WhatsApp concierge
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-20 flex flex-col gap-4 border-t border-stroke/25 pt-10 text-[13px] text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Oxour Go</p>
          <p className="max-w-sm text-[13px] leading-relaxed sm:text-right">
            Built for travellers who prefer discretion over dashboards.
          </p>
        </div>
      </div>
    </footer>
  )
}
