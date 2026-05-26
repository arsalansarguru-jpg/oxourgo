'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Music, Coffee, Wind, Wine, Check, Plus, ShieldCheck, MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export interface ConciergeCustomizerProps {
  vehicleName?: string
  tripFrom?: string
  tripTo?: string
}

export interface ScentOption {
  id: string
  name: string
  tagline: string
  description: string
  notes: string[]
  icon: React.ComponentType<{ className?: string }>
}

export interface AmenityOption {
  id: string
  name: string
  price: number
  description: string
  icon: React.ComponentType<{ className?: string }>
}

const SCENT_OPTIONS: ScentOption[] = [
  {
    id: 'tuscan-leather',
    name: 'Tuscan Leather',
    tagline: 'Deep, Rich & Bold',
    description: 'A robust, smoky leather infused with velvet sweet raspberry and raw wood. Radiates strength and absolute elegance.',
    notes: ['Suede', 'Black Amber', 'Thyme'],
    icon: Wind,
  },
  {
    id: 'citrus-velvet',
    name: 'Citrus Velvet',
    tagline: 'Fresh, Uplifting & Bright',
    description: 'Sun-drenched Calabrian bergamot, fresh orange blossom, and a crisp base of cedarwood. Energizing and premium.',
    notes: ['Neroli', 'Bergamot', 'White Musk'],
    icon: Sparkles,
  },
  {
    id: 'french-lavender',
    name: 'French Lavender',
    tagline: 'Calm, Soothing & Serene',
    description: 'Organic high-altitude French lavender, soft vanilla bean, and earthy patchouli. Promotes peace and supreme relaxation.',
    notes: ['Lavender', 'Vanilla', 'Patchouli'],
    icon: ShieldCheck,
  },
]

const AMENITY_OPTIONS: AmenityOption[] = [
  {
    id: 'gourmet-hamper',
    name: 'Gourmet Trunk Hamper',
    price: 1999,
    description: 'An insulated picnic hamper loaded with artisanal chocolates, hand-roasted nuts, organic dried berries, and fine mineral drinks.',
    icon: Coffee,
  },
  {
    id: 'perrier-sparkling',
    name: 'Chilled Perrier & Spring Water',
    price: 750,
    description: 'Imported Perrier glass bottles and premium spring water, pre-chilled in the console cooler ready for your departure.',
    icon: Wine,
  },
]

export function ConciergeCustomizer({
  vehicleName = 'a luxury vehicle',
  tripFrom,
  tripTo,
}: ConciergeCustomizerProps) {
  const [selectedScent, setSelectedScent] = useState<string | null>(null)
  const [activeAmenities, setActiveAmenities] = useState<string[]>([])
  const [musicVibe, setMusicVibe] = useState('')

  // Construct dynamic WhatsApp inquiry prefill message
  const getWhatsAppPrefill = () => {
    let msg = `Hi Oxour Go, I want to book the ${vehicleName}`
    if (tripFrom && tripTo) {
      msg += ` from ${tripFrom} to ${tripTo}`
    }
    msg += `.`

    const customizations: string[] = []
    if (selectedScent) {
      const scent = SCENT_OPTIONS.find(s => s.id === selectedScent)
      if (scent) customizations.push(`pre-infused with ${scent.name} scent`)
    }
    activeAmenities.forEach(id => {
      const item = AMENITY_OPTIONS.find(o => o.id === id)
      if (item) customizations.push(`with ${item.name}`)
    })
    if (musicVibe.trim()) {
      customizations.push(`and a "${musicVibe.trim()}" custom playlist`)
    }

    if (customizations.length > 0) {
      msg += ` I would like the cabin customized: ${customizations.join(', ')}.`
    }

    msg += ` Pickup at Mira Road hub.`
    return msg
  }

  const whatsappUrl = `https://wa.me/919833133343?text=${encodeURIComponent(getWhatsAppPrefill())}`

  // Toggle amenity selection
  const toggleAmenity = (id: string) => {
    setActiveAmenities(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  // Calculate pricing
  const baseScentPrice = selectedScent ? 499 : 0
  const amenitiesPrice = activeAmenities.reduce((total, id) => {
    const item = AMENITY_OPTIONS.find(opt => opt.id === id)
    return total + (item?.price ?? 0)
  }, 0)
  const totalPrice = baseScentPrice + amenitiesPrice

  // Format currency
  const formatINR = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value)
  }


  return (
    <div className="w-full max-w-4xl mx-auto p-1 md:p-6" id="concierge-panel">
      {/* Header section with brand-gradient */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-stroke bg-fill-glass text-hero-kicker text-xs font-semibold uppercase tracking-wider mb-3">
          <Sparkles className="w-3.5 h-3.5 text-cyan animate-glow-pulse" />
          Bespoke Experience
        </div>
        <h2 className="text-display text-brand-gradient tracking-tight mb-2">
          Curate Your Cabin Experience
        </h2>
        <p className="text-muted type-body max-w-xl mx-auto">
          Elevate your self-drive rental with personalized details designed to indulge your senses. True luxury is custom-tailored.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Choices */}
        <div className="lg:col-span-2 space-y-8">
          {/* Part 1: Ambient Cabin Scenting */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="type-card-title flex items-center gap-2">
                <Wind className="w-5 h-5 text-electric" />
                1. Ambient Scent Diffuser
              </h3>
              <span className="type-caption text-muted bg-fill-glass px-2.5 py-1 rounded-md border border-stroke">
                Pre-infused — +₹499
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {SCENT_OPTIONS.map(scent => {
                const isSelected = selectedScent === scent.id
                const IconComponent = scent.icon
                return (
                  <motion.button
                    key={scent.id}
                    onClick={() => setSelectedScent(isSelected ? null : scent.id)}
                    whileHover={{ y: -4, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className={cn(
                      "flex flex-col text-left p-4 rounded-xl border transition-all duration-200 cursor-pointer h-full relative overflow-hidden",
                      isSelected
                        ? "border-electric bg-fill-glass-strong glow-electric shadow-card-accent"
                        : "border-stroke bg-fill-glass hover:border-stroke-strong hover:bg-fill-glass-strong"
                    )}
                  >
                    {/* Glowing highlight indicator */}
                    {isSelected && (
                      <div className="absolute top-0 right-0 w-24 h-24 bg-electric/10 rounded-full filter blur-xl -translate-y-8 translate-x-8" />
                    )}

                    <div className="flex items-center justify-between mb-3 z-10">
                      <div className={cn(
                        "p-2 rounded-lg",
                        isSelected ? "bg-electric text-white" : "bg-carbon-deep text-electric"
                      )}>
                        <IconComponent className="w-4 h-4" />
                      </div>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-5 h-5 rounded-full bg-emerald flex items-center justify-center text-white"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </motion.div>
                      )}
                    </div>

                    <h4 className="font-semibold text-soft type-card-title mb-1 z-10">{scent.name}</h4>
                    <p className="type-label-sm text-cyan mb-2 tracking-normal font-semibold z-10">{scent.tagline}</p>
                    <p className="type-caption text-muted mb-4 flex-grow z-10">{scent.description}</p>

                    <div className="flex flex-wrap gap-1.5 z-10 mt-auto">
                      {scent.notes.map(note => (
                        <span key={note} className="text-[10px] px-2 py-0.5 rounded-full bg-carbon text-silver border border-stroke">
                          {note}
                        </span>
                      ))}
                    </div>
                  </motion.button>
                )
              })}
            </div>
          </div>

          {/* Part 2: Bespoke Amenities */}
          <div className="space-y-4">
            <h3 className="type-card-title flex items-center gap-2">
              <Coffee className="w-5 h-5 text-electric" />
              2. Luxury Onboard Refreshments
            </h3>

            <div className="space-y-3">
              {AMENITY_OPTIONS.map(amenity => {
                const isActive = activeAmenities.includes(amenity.id)
                const IconComponent = amenity.icon
                return (
                  <motion.div
                    key={amenity.id}
                    layout
                    onClick={() => toggleAmenity(amenity.id)}
                    className={cn(
                      "flex items-start md:items-center justify-between p-4 rounded-xl border transition-all duration-200 cursor-pointer relative overflow-hidden",
                      isActive
                        ? "border-electric bg-fill-glass-strong shadow-card-accent"
                        : "border-stroke bg-fill-glass hover:border-stroke-strong"
                    )}
                  >
                    <div className="flex items-start gap-4 z-10 max-w-[80%]">
                      <div className={cn(
                        "p-3 rounded-xl shrink-0 mt-1 md:mt-0",
                        isActive ? "bg-electric text-white" : "bg-carbon-deep text-electric"
                      )}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-soft type-card-title flex items-center gap-2">
                          {amenity.name}
                          <span className="text-xs px-2.5 py-0.5 rounded bg-electric/15 text-electric border border-electric/10 font-bold">
                            {formatINR(amenity.price)}
                          </span>
                        </h4>
                        <p className="type-caption text-muted mt-1 leading-relaxed">{amenity.description}</p>
                      </div>
                    </div>

                    <div className="shrink-0 z-10 self-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleAmenity(amenity.id)
                        }}
                        className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-200",
                          isActive
                            ? "bg-emerald border-emerald text-white"
                            : "border-stroke bg-carbon-deep hover:border-stroke-strong hover:bg-fill-glass text-muted hover:text-soft"
                        )}
                      >
                        {isActive ? (
                          <Check className="w-5 h-5 stroke-[2.5]" />
                        ) : (
                          <Plus className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>

          {/* Part 3: Soundtrack Pairing */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="type-card-title flex items-center gap-2">
                <Music className="w-5 h-5 text-electric" />
                3. Custom Cabin Soundtrack
              </h3>
              <span className="type-caption text-emerald bg-emerald/10 border border-emerald/20 px-2.5 py-1 rounded-md font-bold uppercase tracking-wider">
                Complimentary
              </span>
            </div>

            <div className="glass-panel p-5 rounded-xl border border-stroke flex flex-col md:flex-row items-center gap-5 relative overflow-hidden">
              {/* Music Equalizer Visualizer */}
              <AnimatePresence>
                {musicVibe.length > 2 && (
                  <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="flex items-end gap-1 h-8 shrink-0 select-none px-2"
                  >
                    {[1, 2, 3, 4, 5, 6].map(i => (
                      <motion.div
                        key={i}
                        animate={{
                          height: [6, 32, 10, 24, 8, 18, 6][(i + Math.floor(Math.random() * 5)) % 7],
                        }}
                        transition={{
                          repeat: Infinity,
                          duration: 0.8 + i * 0.1,
                          ease: 'easeInOut',
                        }}
                        className="w-1.5 rounded-full bg-cyan"
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex-grow w-full space-y-2">
                <input
                  type="text"
                  value={musicVibe}
                  onChange={(e) => setMusicVibe(e.target.value)}
                  placeholder="e.g., Late Night Chill Beats, Classic Rock, Uplifting Bollywood..."
                  className="w-full bg-matte border border-stroke rounded-lg px-4 py-3 text-soft placeholder:text-muted focus:border-electric focus:ring-2 focus:ring-electric/25 transition-all duration-200 outline-none type-body"
                />
                <p className="type-caption text-muted">
                  Share the vibe of your journey. Our team will pre-load a matching curated playlist accessible via a sleek dashboard QR code.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Luxury Summary Card */}
        <div className="lg:col-span-1">
          <div className="glass-panel p-6 rounded-2xl border border-stroke-strong sticky top-24 space-y-6">
            <h3 className="type-card-title border-b border-stroke pb-4 text-soft">
              Your Cabin Summary
            </h3>

            {/* Customizations List */}
            <div className="space-y-4 min-h-[140px] flex flex-col justify-start">
              {/* Diffuser row */}
              <div className="flex items-center justify-between text-sm py-1">
                <span className="text-muted flex items-center gap-2">
                  <Wind className="w-4 h-4 text-electric" />
                  Scent Diffuser
                </span>
                <span className="font-semibold text-soft">
                  {selectedScent
                    ? SCENT_OPTIONS.find(s => s.id === selectedScent)?.name
                    : 'Not Selected'}
                </span>
              </div>

              {/* Amenities list */}
              {activeAmenities.map(id => {
                const item = AMENITY_OPTIONS.find(o => o.id === id)
                if (!item) return null
                return (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={id}
                    className="flex items-center justify-between text-sm py-1"
                  >
                    <span className="text-muted flex items-center gap-2">
                      <Coffee className="w-4 h-4 text-electric" />
                      {item.name}
                    </span>
                    <span className="font-semibold text-soft">
                      {formatINR(item.price)}
                    </span>
                  </motion.div>
                )
              })}

              {/* Soundtrack playlist row */}
              {musicVibe && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between text-sm py-1 border-t border-stroke/50 pt-3"
                >
                  <span className="text-muted flex items-center gap-2">
                    <Music className="w-4 h-4 text-cyan" />
                    Trip Playlist
                  </span>
                  <span className="font-semibold text-cyan truncate max-w-[120px] text-right">
                    &ldquo;{musicVibe}&rdquo;
                  </span>
                </motion.div>
              )}

              {/* Placeholder when nothing is configured */}
              {!selectedScent && activeAmenities.length === 0 && !musicVibe && (
                <div className="text-center my-auto py-8">
                  <Sparkles className="w-8 h-8 text-stroke-strong mx-auto mb-2" />
                  <p className="type-caption text-muted">
                    No custom cabin selections configured yet.
                  </p>
                </div>
              )}
            </div>

            {/* Price section */}
            <div className="border-t border-stroke pt-4 space-y-2">
              <div className="flex items-center justify-between text-sm text-muted">
                <span>Custom Amenities Total</span>
                <span>{formatINR(totalPrice)}</span>
              </div>
              <div className="flex items-end justify-between pt-2">
                <span className="font-bold text-soft">Total Experience</span>
                <span className="type-metric text-electric font-bold">
                  {formatINR(totalPrice)}
                </span>
              </div>
            </div>

            {/* Glowing Action Button */}
            <motion.a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="w-full py-3.5 rounded-xl font-bold uppercase tracking-wider text-xs transition-all duration-300 relative overflow-hidden flex items-center justify-center gap-2 bg-electric border border-electric/30 text-white hover:shadow-glow shadow-card hover:text-white"
            >
              <MessageCircle className="w-4 h-4 shrink-0" />
              Book on WhatsApp with Selections
            </motion.a>
          </div>
        </div>
      </div>
    </div>
  )
}
