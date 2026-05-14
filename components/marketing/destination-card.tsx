'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { cardLiftSpring } from '@/animations/presets'
import type { Destination } from '@/data/destinations'
import { cn } from '@/lib/utils/cn'
import {
  cardBody,
  cardSurfaceBase,
  cardSurfaceHover,
  cardSurfaceTransition,
  cardTitle,
} from '@/components/ui/card-tokens'

type DestinationCardProps = {
  destination: Destination
  className?: string
}

export function DestinationCard({ destination, className }: DestinationCardProps) {
  const href = `/destinations/${destination.id}`

  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={cardLiftSpring}
      className={cn('overflow-hidden rounded-2xl', className)}
    >
      <Link
        href={href}
        className={cn(
          cardSurfaceBase,
          cardSurfaceTransition,
          cardSurfaceHover,
          'group/card relative block cursor-pointer overflow-hidden rounded-2xl transition-[box-shadow,border-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
          'hover:border-electric/30 hover:shadow-[0_0_0_1px_rgba(59,130,246,0.22),0_20px_50px_-26px_rgba(59,130,246,0.28)]',
        )}
      >
        <div className="relative aspect-[4/3] bg-carbon-deep">
          <Image
            src={destination.imageUrl}
            alt={destination.title}
            fill
            className="object-cover transition-[transform,filter] duration-[560ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/card:scale-[1.035] group-hover/card:brightness-[1.04]"
            sizes="(max-width:640px) 100vw,(max-width:1024px) 50vw, 25vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-matte via-matte/[0.38] to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 md:p-6">
            <h3 className={cn(cardTitle, 'drop-shadow-[0_2px_12px_rgba(0,0,0,0.45)]')}>{destination.title}</h3>
            <p className={cn(cardBody, 'mt-2 max-w-prose text-pretty text-soft/85')}>{destination.description}</p>
            <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-electric/90">
              Explore fleet →
            </p>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
