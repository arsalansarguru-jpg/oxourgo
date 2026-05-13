'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'

import { BRAND } from '@/constants/brand'
import { cn } from '@/lib/utils/cn'

const ease = [0.22, 1, 0.36, 1] as const

/** Cinematic luxury mobility — exterior / night premium feel */
const HERO_SRC =
  'https://images.unsplash.com/photo-1619767886558-ef789acc1036?auto=format&fit=crop&w=2000&q=88'

type LoginHeroPanelProps = {
  className?: string
}

export function LoginHeroPanel({ className }: LoginHeroPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 1.02 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.85, ease }}
      className={cn(
        'relative isolate flex min-h-[220px] flex-col overflow-hidden rounded-2xl border border-stroke shadow-[0_1px_0_0_rgba(255,255,255,0.06)_inset,0_40px_120px_-48px_rgba(0,0,0,0.95)] sm:min-h-[280px] lg:min-h-0 lg:rounded-3xl',
        className,
      )}
    >
      <Image
        src={HERO_SRC}
        alt="Premium vehicle in a refined urban night setting"
        fill
        priority
        unoptimized
        sizes="(max-width: 1024px) 100vw, 50vw"
        className="object-cover object-[center_58%] lg:object-[center_52%]"
      />

      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_50%_100%,rgba(10,10,12,0.92),transparent_58%),radial-gradient(ellipse_60%_50%_at_80%_20%,rgba(59,130,246,0.12),transparent_55%),linear-gradient(165deg,rgba(10,10,12,0.15)_0%,rgba(10,10,12,0.55)_45%,rgba(10,10,12,0.92)_100%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E")`,
        }}
        aria-hidden
      />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, delay: 0.15, ease }}
        className="relative flex flex-1 flex-col justify-end p-6 sm:p-8 lg:p-10"
      >
        <div className="mb-3 inline-flex w-fit items-center gap-2 rounded-full border border-stroke-strong bg-matte/35 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-soft/90 backdrop-blur-md">
          <Sparkles className="h-3.5 w-3.5 text-electric" aria-hidden />
          {BRAND.name}
        </div>
        <h1 className="max-w-lg text-balance text-2xl font-semibold tracking-[-0.04em] text-soft sm:text-3xl lg:text-[clamp(1.75rem,2.2vw+1rem,2.75rem)] lg:leading-[1.08]">
          The quiet confidence of a chauffeured-grade fleet — on your schedule.
        </h1>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-silver/95 sm:text-[0.9375rem]">
          Identity verification, live pricing, and concierge routing built for Mumbai&apos;s premium
          mile. No counters. No friction.
        </p>
      </motion.div>
    </motion.div>
  )
}
