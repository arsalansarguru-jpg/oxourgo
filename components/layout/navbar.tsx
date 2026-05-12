'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, MessageCircle, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { BRAND } from '@/constants/brand'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/Button'
import { BrandLogo } from '@/components/layout/brand-logo'

const nav = [
  { href: '/fleet', label: 'Fleet' },
  { href: '/about', label: 'About' },
  { href: '/support', label: 'Support' },
] as const

const ease = [0.22, 1, 0.36, 1] as const

export function Navbar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-50 border-b transition-[background-color,backdrop-filter,border-color,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
          scrolled
            ? 'border-white/[0.08] bg-matte/[0.78] shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset,0_18px_48px_-28px_rgba(0,0,0,0.75)] backdrop-blur-2xl backdrop-saturate-[1.35] supports-[backdrop-filter]:bg-matte/[0.62]'
            : 'border-white/[0.05] bg-matte/[0.52] shadow-[0_24px_64px_-40px_rgba(0,0,0,0.55)] backdrop-blur-3xl backdrop-saturate-[1.2] supports-[backdrop-filter]:bg-matte/[0.38]',
        )}
      >
        <div className="container-app grid h-[3.25rem] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 sm:h-14 lg:h-[3.75rem] lg:gap-4">
          <Link
            href="/"
            className="group flex min-w-0 max-w-[min(100%,14rem)] items-center gap-2.5 justify-self-start sm:max-w-none sm:gap-3"
            onClick={() => setOpen(false)}
          >
            <div
              className={cn(
                'relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-[0.625rem] border border-white/[0.09] bg-gradient-to-b from-white/[0.11] to-white/[0.02] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12),0_0_0_1px_rgba(0,0,0,0.35)] transition-[transform,box-shadow,border-color] duration-300 sm:h-9 sm:w-9 sm:rounded-[0.6875rem]',
                'group-hover:-translate-y-px group-hover:border-white/[0.14] group-hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.14),0_0_0_1px_rgba(59,130,246,0.12),0_12px_40px_-18px_rgba(59,130,246,0.35)]',
              )}
            >
              <BrandLogo priority className="relative z-10 p-[3px]" />
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_0%,rgba(59,130,246,0.22),transparent_62%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              />
            </div>
            <div className="min-w-0 leading-none">
              <p className="truncate text-[0.8125rem] font-semibold tracking-[-0.03em] text-soft sm:text-[0.9375rem]">
                {BRAND.name}
              </p>
              <p className="mt-1 hidden truncate text-[10px] font-medium uppercase tracking-[0.18em] text-muted sm:block">
                {BRAND.tagline}
              </p>
            </div>
          </Link>

          <nav
            aria-label="Primary"
            className="hidden items-center justify-center justify-self-center md:flex"
          >
            <div className="flex items-center rounded-full border border-white/[0.07] bg-white/[0.025] p-1 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] backdrop-blur-md">
              {nav.map(({ href, label }) => {
                const active = pathname === href || pathname.startsWith(`${href}/`)
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      'relative rounded-full px-3.5 py-2 text-[13px] font-medium tracking-[-0.01em] transition-[color,background-color,transform] duration-300 lg:px-4',
                      active
                        ? 'text-soft'
                        : 'text-muted hover:bg-white/[0.05] hover:text-soft',
                    )}
                  >
                    {active ? (
                      <span
                        aria-hidden
                        className="absolute inset-0 rounded-full bg-white/[0.09] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
                      />
                    ) : null}
                    <span className="relative">{label}</span>
                  </Link>
                )
              })}
            </div>
          </nav>

          <div className="flex items-center justify-end gap-1.5 justify-self-end sm:gap-2 lg:gap-2.5">
            <Button
              variant="ghost"
              size="sm"
              className="hidden h-9 px-3 text-[13px] font-medium text-muted hover:translate-y-0 hover:bg-white/[0.05] hover:text-soft active:translate-y-0 lg:inline-flex"
              href={BRAND.whatsapp}
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle className="h-[15px] w-[15px] opacity-90" />
              WhatsApp
            </Button>
            <Button
              variant="secondary"
              size="sm"
              to="/login"
              className="hidden h-9 border-white/[0.1] bg-white/[0.05] px-3.5 text-[13px] font-medium text-soft shadow-none hover:translate-y-0 hover:border-white/[0.16] hover:bg-white/[0.09] active:translate-y-0 sm:inline-flex"
            >
              Log in
            </Button>
            <Button
              size="sm"
              to="/fleet"
              className="hidden h-9 px-4 text-[13px] font-semibold shadow-[0_12px_36px_-16px_rgba(59,130,246,0.55)] hover:translate-y-0 active:translate-y-0 sm:inline-flex"
            >
              Book now
            </Button>

            <button
              type="button"
              className={cn(
                'touch-manipulation inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[0.625rem] border text-soft transition-[transform,border-color,background-color,color,box-shadow] duration-300 active:scale-[0.96] md:hidden',
                open
                  ? 'border-white/[0.14] bg-white/[0.1] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]'
                  : 'border-white/[0.1] bg-white/[0.04] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] hover:border-white/[0.14] hover:bg-white/[0.08]',
              )}
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
              aria-controls="mobile-nav"
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X className="h-[18px] w-[18px]" strokeWidth={2} /> : <Menu className="h-[18px] w-[18px]" strokeWidth={2} />}
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence mode="sync">
        {open ? (
          <>
            <motion.button
              key="nav-backdrop"
              type="button"
              aria-label="Close menu"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.28, ease }}
              className="fixed inset-0 z-[60] bg-matte/55 backdrop-blur-md md:hidden"
              onClick={() => setOpen(false)}
            />
            <motion.div
              key="nav-panel"
              id="mobile-nav"
              role="dialog"
              aria-modal="true"
              aria-label="Navigation"
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.38, ease }}
              className="fixed left-0 right-0 top-[3.25rem] z-[70] max-h-[calc(100dvh-3.25rem)] overflow-y-auto border-b border-white/[0.08] bg-matte/[0.92] shadow-[0_24px_80px_-32px_rgba(0,0,0,0.85)] backdrop-blur-2xl backdrop-saturate-[1.25] supports-[backdrop-filter]:bg-matte/[0.78] sm:top-14 sm:max-h-[calc(100dvh-3.5rem)] md:hidden"
            >
              <div className="container-app flex flex-col gap-1 py-5">
                <p className="px-1 pb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted">
                  Menu
                </p>
                {nav.map(({ href, label }, i) => {
                  const active = pathname === href || pathname.startsWith(`${href}/`)
                  return (
                    <motion.div
                      key={href}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.32, delay: 0.04 + i * 0.05, ease }}
                    >
                      <Link
                        href={href}
                        className={cn(
                          'block min-h-12 rounded-xl px-3 py-4 text-[15px] font-medium leading-snug tracking-[-0.02em] transition-[color,background-color,box-shadow] duration-200',
                          active
                            ? 'bg-white/[0.08] text-soft shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]'
                            : 'text-muted hover:bg-white/[0.05] hover:text-soft',
                        )}
                        onClick={() => setOpen(false)}
                      >
                        {label}
                      </Link>
                    </motion.div>
                  )
                })}

                <a
                  href={BRAND.whatsapp}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 flex min-h-12 items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-3.5 text-[15px] font-medium text-soft transition-[border-color,background-color] duration-200 hover:border-electric/25 hover:bg-electric/[0.06] touch-manipulation active:bg-white/[0.05]"
                >
                  <MessageCircle className="h-[18px] w-[18px] text-electric" />
                  WhatsApp concierge
                </a>

                <div className="mt-5 grid gap-3 border-t border-white/[0.06] pt-5">
                  <Button
                    size="lg"
                    to="/fleet"
                    className="min-h-[3.25rem] w-full text-[15px] font-semibold shadow-[0_16px_48px_-20px_rgba(59,130,246,0.55)]"
                    onClick={() => setOpen(false)}
                  >
                    Book now
                  </Button>
                  <Button
                    variant="secondary"
                    size="lg"
                    to="/login"
                    className="min-h-[3.25rem] w-full border-white/[0.12] bg-white/[0.06] text-[15px] font-medium hover:translate-y-0 hover:bg-white/[0.1] active:translate-y-0"
                    onClick={() => setOpen(false)}
                  >
                    Log in
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </>
  )
}
