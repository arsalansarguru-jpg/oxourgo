import React from 'react'
import { ConciergeCustomizer } from '@/components/booking/concierge-customizer'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Bespoke Concierge Demo — Oxour Go',
  description: 'Interactive preview of the premium cabin experience selections and customizer dashboard.',
}

export default function ConciergeDemoPage() {
  return (
    <main className="min-h-screen py-12 md:py-20 bg-matte" id="main">
      <div className="container-app">
        {/* Decorative background gradients scoped to section */}
        <div className="relative">
          <div className="absolute top-0 left-1/4 -translate-x-1/2 w-72 h-72 bg-electric/10 rounded-full filter blur-3xl opacity-60 pointer-events-none" />
          <div className="absolute top-1/3 right-1/4 translate-x-1/2 w-96 h-96 bg-cyan/5 rounded-full filter blur-3xl opacity-50 pointer-events-none" />

          {/* Interactive Concierge Customizer component */}
          <div className="relative z-10">
            <ConciergeCustomizer />
          </div>
        </div>
      </div>
    </main>
  )
}
