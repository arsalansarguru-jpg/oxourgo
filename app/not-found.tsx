import Link from 'next/link'
import { ArrowLeft, CarFront } from 'lucide-react'

import { PublicLayout } from '@/components/layout/PublicLayout'
import { Button } from '@/components/ui/Button'

export default function NotFound() {
  return (
    <PublicLayout>
      <div className="mx-auto flex min-h-[min(72vh,640px)] max-w-lg flex-col items-center justify-center px-[var(--spacing-edge)] py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-electric/25 bg-electric/10">
          <CarFront className="h-8 w-8 text-electric" aria-hidden />
        </div>
        <p className="mt-8 text-[10px] font-semibold uppercase tracking-[0.22em] text-electric/90">404</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-soft sm:text-4xl">Route not found</h1>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          This page is not part of the Oxour Go fleet experience. Return home or browse available vehicles in Mumbai.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Button to="/" size="lg">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Home
          </Button>
          <Button to="/fleet" variant="secondary" size="lg">
            Browse fleet
          </Button>
        </div>
        <p className="mt-8 text-xs text-muted">
          Need help?{' '}
          <Link href="/support" className="text-electric hover:underline">
            Contact concierge
          </Link>
        </p>
      </div>
    </PublicLayout>
  )
}
