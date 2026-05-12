import Link from 'next/link'
import { Section } from '@/components/ui/Section'

const links = [
  { href: '/', label: 'Home' },
  { href: '/fleet', label: 'Fleet' },
  { href: '/login', label: 'Login' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/support', label: 'Support' },
  { href: '/about', label: 'About' },
  { href: '/terms', label: 'Terms & Conditions' },
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/refund', label: 'Refund Policy' },
  { href: '/insurance', label: 'Insurance' },
  { href: '/careers', label: 'Careers' },
  { href: '/accessibility', label: 'Accessibility' },
  { href: '/cookies', label: 'Cookie Policy' },
] as const

export default function SitemapPage() {
  return (
    <Section className="pt-10 pb-16">
      <h1 className="text-3xl font-bold text-soft md:text-4xl">Sitemap</h1>
      <p className="mt-3 max-w-2xl text-silver">
        Quick navigation to every public surface of Oxour Go. Vehicle detail and booking URLs use slugs
        from the fleet (for example,{' '}
        <Link href="/car/bmw-5-series" className="text-electric hover:underline">
          /car/bmw-5-series
        </Link>
        ).
      </p>
      <ul className="mt-8 grid gap-2 sm:grid-cols-2">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-carbon/50 px-4 py-3 text-sm font-medium text-soft transition hover:border-electric/35"
            >
              {l.label}
              <span className="text-xs text-silver">{l.href}</span>
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  )
}
