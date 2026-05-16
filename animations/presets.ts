/** Shared Framer Motion presets — import from `@/animations/presets` for consistency */

export const easePremium = [0.22, 1, 0.36, 1] as const

export const transitionFast = {
  duration: 0.32,
  ease: easePremium,
} as const

export const transitionNormal = {
  duration: 0.45,
  ease: easePremium,
} as const

export const fadeSlide = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: 0.34, ease: easePremium },
}

export const staggerContainer = {
  initial: {},
  animate: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.04 },
  },
}

export const staggerItem = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-72px 0px -48px 0px' },
  transition: transitionNormal,
}

export const fadeInHero = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: transitionNormal,
}

/** Unified lift for marketing / dashboard cards */
export const cardLiftSpring = {
  type: 'spring',
  stiffness: 320,
  damping: 42,
  mass: 0.72,
} as const
