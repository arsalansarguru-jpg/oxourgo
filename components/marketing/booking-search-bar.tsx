'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { motion } from 'framer-motion'
import { PICKUP_LOCATIONS } from '@/constants/brand'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import { TrustBadge } from '@/components/marketing/trust-badge'
import { BadgeCheck, Headphones, Receipt } from 'lucide-react'

export function BookingSearchBar() {
  const router = useRouter()
  const [pickup, setPickup] = useState<string>(PICKUP_LOCATIONS[0])
  const [pickupDate, setPickupDate] = useState('')
  const [dropoffDate, setDropoffDate] = useState('')

  const onSearch = () => {
    const q = new URLSearchParams({
      pickup,
      from: pickupDate,
      to: dropoffDate,
    })
    router.push(`/fleet?${q.toString()}`)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.48, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      className="relative mx-auto w-full max-w-[var(--container-wide)] xl:max-w-5xl"
    >
      <div className="glass-panel rounded-[1.25rem] p-4 shadow-[var(--shadow-card)] sm:rounded-3xl sm:p-6 lg:p-7">
        <div className="grid gap-4 sm:gap-5 md:grid-cols-2 md:gap-5 lg:grid-cols-4 lg:items-end lg:gap-5">
          <Select
            label="Pickup Location"
            value={pickup}
            onChange={(e) => setPickup(e.target.value)}
          >
            {PICKUP_LOCATIONS.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </Select>
          <Input
            label="Pickup Date"
            type="date"
            value={pickupDate}
            onChange={(e) => setPickupDate(e.target.value)}
          />
          <Input
            label="Dropoff Date"
            type="date"
            value={dropoffDate}
            onChange={(e) => setDropoffDate(e.target.value)}
          />
          <Button type="button" size="lg" className="w-full shrink-0" onClick={onSearch}>
            <Search className="h-4 w-4" />
            Search Cars
          </Button>
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 sm:justify-start md:gap-2.5">
          <TrustBadge icon={BadgeCheck} label="Verified Cars" />
          <TrustBadge icon={Receipt} label="No Hidden Charges" />
          <TrustBadge icon={Headphones} label="24x7 Support" />
        </div>
      </div>
      <div
        className="pointer-events-none absolute -inset-4 -z-10 rounded-[2rem] opacity-70 blur-3xl"
        style={{
          background:
            'radial-gradient(ellipse at 30% 20%, rgba(59,130,246,0.22), transparent 55%), radial-gradient(ellipse at 80% 0%, rgba(196,201,212,0.12), transparent 45%)',
        }}
      />
    </motion.div>
  )
}
