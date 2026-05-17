'use client'

import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'

import { navigationShellKey } from '@/lib/nav/site-nav'

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const shellKey = navigationShellKey(pathname)

  return (
    <AnimatePresence mode="sync" initial={false}>
      <motion.div
        key={shellKey}
        initial={{ opacity: 0.97 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0.97 }}
        transition={{ duration: 0.14, ease: 'easeOut' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
