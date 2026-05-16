import Link from 'next/link'
import { BRAND } from '@/constants/brand'
import { BrandLogo } from '@/components/layout/brand-logo'

const link = 'text-sm text-muted transition-colors hover:text-soft'

export function Footer() {
  return (
    <footer className="border-t border-stroke bg-carbon">
      <div className="container-app py-12 lg:py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          <div className="lg:col-span-1">
            <Link href="/" className="inline-block">
              <BrandLogo className="h-9 w-auto max-w-[9rem]" />
            </Link>
            <p className="mt-3 text-sm text-muted">{BRAND.tagline}</p>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Self-drive rentals in Mumbai with verified vehicles and transparent pricing.
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-soft">Product</p>
            <ul className="mt-3 space-y-2">
              <li>
                <Link href="/fleet" className={link}>
                  Fleet
                </Link>
              </li>
              <li>
                <Link href="/insurance" className={link}>
                  Insurance
                </Link>
              </li>
              <li>
                <Link href="/support" className={link}>
                  Support
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-medium text-soft">Company</p>
            <ul className="mt-3 space-y-2">
              <li>
                <Link href="/about" className={link}>
                  About
                </Link>
              </li>
              <li>
                <Link href="/careers" className={link}>
                  Careers
                </Link>
              </li>
              <li>
                <a href={BRAND.whatsapp} target="_blank" rel="noopener noreferrer" className={link}>
                  WhatsApp
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-medium text-soft">Legal</p>
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
                <a href={`mailto:${BRAND.email}`} className={link}>
                  {BRAND.email}
                </a>
              </li>
              <li>
                <a href={`tel:${BRAND.phoneTel}`} className={link}>
                  {BRAND.phoneDisplay}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-stroke pt-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {BRAND.name}
          </p>
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
