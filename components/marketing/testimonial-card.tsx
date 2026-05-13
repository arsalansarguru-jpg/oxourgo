'use client'

import { motion } from 'framer-motion'
import { Quote } from 'lucide-react'
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
      <Quote className="h-7 w-7 shrink-0 text-electric/75 sm:h-8 sm:w-8" aria-hidden />
      <blockquote className={cn(cardBody, 'mt-4 flex-1 text-pretty sm:text-[0.9375rem]')}>
        “{testimonial.quote}”
      </blockquote>
      <figcaption className="mt-6 border-t border-stroke pt-4">
        <p className="text-[0.9375rem] font-semibold tracking-[-0.02em] text-soft">{testimonial.name}</p>
        <p className="mt-1 text-xs leading-relaxed text-muted">{testimonial.role}</p>
      </figcaption>
    </motion.figure>
  )
}
