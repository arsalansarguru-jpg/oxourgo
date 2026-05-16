'use client'

import type { LucideIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import { cardLiftSpring } from '@/animations/presets'
import { cn } from '@/lib/utils/cn'
import {
  cardBody,
  cardIconTile,
  cardPaddingFeature,
  cardSurfaceGlass,
  cardSurfaceGlassHover,
  cardSurfaceTransition,
  cardTitle,
} from '@/components/ui/card-tokens'

type FeatureCardProps = {
  icon: LucideIcon
  title: string
  description: string
  className?: string
}

export function FeatureCard({ icon: Icon, title, description, className }: FeatureCardProps) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={cardLiftSpring}
      className={cn(
        'group/card',
        cardSurfaceGlass,
        cardSurfaceTransition,
        cardSurfaceGlassHover,
        cardPaddingFeature,
        className,
      )}
    >
      <div className={cn(cardIconTile)}>
        <Icon className="h-5 w-5" />
      </div>
      <h3 className={cn(cardTitle, 'mt-5')}>{title}</h3>
      <p className={cn(cardBody, 'mt-2.5')}>{description}</p>
    </motion.div>
  )
}
