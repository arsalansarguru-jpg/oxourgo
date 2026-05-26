'use client'

import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'

import { navigationShellKey } from '@/lib/nav/site-nav'

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const shellKey = navigationShellKey(pathname)

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={shellKey}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
