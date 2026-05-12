'use client'

import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import { cardLiftSpring } from '@/animations/presets'
import { cn } from '@/lib/utils/cn'
import {
  cardBody,
  cardIconTile,
  cardPadding,
  cardSurfaceBase,
  cardSurfaceHover,
  cardSurfaceTransition,
  cardTitle,
} from '@/components/ui/card-tokens'

type SupportCardProps = {
  icon: LucideIcon
  title: string
  description: string
  action?: ReactNode
  className?: string
}

export function SupportCard({ icon: Icon, title, description, action, className }: SupportCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={cardLiftSpring}
      className={cn(
        'group/card flex h-full flex-col',
        cardSurfaceBase,
        cardSurfaceTransition,
        cardSurfaceHover,
        cardPadding,
        className,
      )}
    >
      <div className={cn(cardIconTile, 'h-10 w-10 group-hover/card:-translate-y-px')}>
        <Icon className="h-5 w-5" />
      </div>
      <h3 className={cn(cardTitle, 'mt-4 text-base sm:text-[1.0625rem]')}>{title}</h3>
      <p className={cn(cardBody, 'mt-2 flex-1')}>{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </motion.div>
  )
}
