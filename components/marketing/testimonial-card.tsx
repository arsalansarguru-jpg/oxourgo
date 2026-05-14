'use client'

import { motion } from 'framer-motion'
import { Quote, Star } from 'lucide-react'
import { cardLiftSpring } from '@/animations/presets'
import type { Testimonial } from '@/data/testimonials'
import { cn } from '@/lib/utils/cn'
import {
  cardBody,
  cardPaddingFeature,
  cardSurfaceBase,
  cardSurfaceHover,
  cardSurfaceTransition,
} from '@/components/ui/card-tokens'

type TestimonialCardProps = {
  testimonial: Testimonial
  className?: string
}

export function TestimonialCard({ testimonial, className }: TestimonialCardProps) {
  return (
    <motion.figure
      whileHover={{ y: -4 }}
      transition={cardLiftSpring}
      className={cn(
        'flex h-full flex-col',
        cardSurfaceBase,
        cardSurfaceTransition,
        cardSurfaceHover,
        cardPaddingFeature,
        className,
      )}
    >
      <div className="flex items-center gap-1 text-electric">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={cn(
              'h-4 w-4',
              i < Math.round(testimonial.rating) ? 'fill-electric/30' : 'fill-transparent opacity-35',
            )}
            aria-hidden
          />
        ))}
      </div>
      <Quote className="mt-4 h-7 w-7 shrink-0 text-electric/75 sm:h-8 sm:w-8" aria-hidden />
      <blockquote className={cn(cardBody, 'mt-3 flex-1 text-pretty sm:text-[0.9375rem]')}>
        “{testimonial.quote}”
      </blockquote>
      <figcaption className="mt-6 flex items-center gap-3 border-t border-stroke pt-4">
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-stroke bg-electric/15 text-xs font-bold text-electric"
          aria-hidden
        >
          {testimonial.initials}
        </span>
        <div className="min-w-0">
          <p className="text-[0.9375rem] font-semibold tracking-[-0.02em] text-soft">{testimonial.name}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted">{testimonial.role}</p>
          <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.12em] text-electric/90">
            {testimonial.verifiedLabel}
          </p>
        </div>
      </figcaption>
    </motion.figure>
  )
}
