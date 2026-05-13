import Link from 'next/link'
import { BRAND } from '@/constants/brand'
import { BrandLogo } from '@/components/layout/brand-logo'

const linkClass =
  'text-sm text-muted transition-[color,opacity] duration-300 hover:text-soft hover:opacity-100'

export function Footer() {
  return (
    <footer className="border-t border-stroke bg-carbon-deep">
      <div className="container-app py-[clamp(3.25rem,6vw,4.75rem)] 2xl:max-w-[var(--container-wide)]">
        <div className="grid grid-cols-1 gap-10 md:gap-x-8 md:gap-y-10 md:[grid-template-columns:minmax(0,min(100%,20rem))_minmax(0,1fr)] lg:grid-cols-[minmax(0,min(100%,22rem))_repeat(3,minmax(0,1fr))] lg:gap-x-8 lg:gap-y-0 lg:items-start">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-stroke bg-gradient-to-br from-fill-glass-strong to-transparent shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
                <BrandLogo className="p-[3px]" />
              </span>
              <span className="text-[0.9375rem] font-bold tracking-[-0.02em] text-soft">{BRAND.name}</span>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
              Experience premium self-drive car rentals in Mumbai. Verified cars, transparent pricing,
              and 24x7 support.
            </p>
          </div>

          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-soft/95">Company</p>
            <ul className="mt-4 flex flex-col gap-2">
              <li>
                <Link href="/about" className={linkClass}>
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/fleet" className={linkClass}>
                  Our Fleet
                </Link>
              </li>
              <li>
                <Link href="/support" className={linkClass}>
                  Support
                </Link>
              </li>
              <li>
                <Link href="/careers" className={linkClass}>
                  Careers
                </Link>
              </li>
            </ul>
          </div>

          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-soft/95">Legal</p>
            <ul className="mt-4 flex flex-col gap-2">
              <li>
                <Link href="/terms" className={linkClass}>
                  Terms &amp; Conditions
                </Link>
              </li>
              <li>
                <Link href="/privacy" className={linkClass}>
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/refund" className={linkClass}>
                  Refund Policy
                </Link>
              </li>
              <li>
                <Link href="/insurance" className={linkClass}>
                  Insurance
                </Link>
              </li>
            </ul>
          </div>

          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-soft/95">Contact</p>
            <ul className="mt-4 flex flex-col gap-2 text-sm text-muted">
              <li>{BRAND.address}</li>
              <li>
                <a href={`tel:${BRAND.phoneTel}`} className="transition-colors duration-300 hover:text-soft">
                  {BRAND.phoneDisplay}
                </a>
              </li>
              <li>
                <a href={`mailto:${BRAND.email}`} className="transition-colors duration-300 hover:text-soft">
                  {BRAND.email}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-stroke pt-9 text-sm text-muted md:flex-row md:items-center md:justify-between">
          <p>© 2026 Oxour Go. All rights reserved.</p>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <Link href="/sitemap" className={linkClass}>
              Sitemap
            </Link>
            <Link href="/accessibility" className={linkClass}>
              Accessibility
            </Link>
            <Link href="/cookies" className={linkClass}>
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
