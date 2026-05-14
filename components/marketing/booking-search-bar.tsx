'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, BadgeCheck, Headphones, Loader2, Receipt, Search } from 'lucide-react'
import { motion } from 'framer-motion'

import { PICKUP_LOCATIONS } from '@/constants/brand'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import { TrustBadge } from '@/components/marketing/trust-badge'

function toYmd(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function parseYmd(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim())
  if (!m) return null
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  return Number.isNaN(d.getTime()) ? null : d
}

function addDaysYmd(ymd: string, days: number): string {
  const d = parseYmd(ymd)
  if (!d) return ymd
  d.setDate(d.getDate() + days)
  return toYmd(d)
}

export function BookingSearchBar() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [pickup, setPickup] = useState<string>(PICKUP_LOCATIONS[0])
  const [pickupDate, setPickupDate] = useState('')
  const [dropoffDate, setDropoffDate] = useState('')
  const [keywords, setKeywords] = useState('')
  const [error, setError] = useState<string | null>(null)

  const todayYmd = useMemo(() => toYmd(new Date()), [])
  const dropoffMin = pickupDate || todayYmd

  const onSearch = () => {
    setError(null)
    if (!pickupDate.trim()) {
      setError('Choose a pickup date.')
      return
    }
    if (!dropoffDate.trim()) {
      setError('Choose a return date.')
      return
    }
    const p = parseYmd(pickupDate)
    const r = parseYmd(dropoffDate)
    const t0 = parseYmd(todayYmd)
    if (!p || !r || !t0) {
      setError('Enter valid calendar dates.')
      return
    }
    if (p < t0) {
      setError('Pickup cannot be in the past.')
      return
    }
    if (r <= p) {
      setError('Return must be after pickup (at least the next day).')
      return
    }

    const q = new URLSearchParams()
    q.set('pickup', pickup)
    q.set('from', pickupDate)
    q.set('to', dropoffDate)
    q.set('location', pickup)
    const kw = keywords.trim()
    if (kw) q.set('q', kw)

    startTransition(() => {
      router.push(`/fleet?${q.toString()}`)
    })
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
          <Select label="Pickup Location" value={pickup} onChange={(e) => setPickup(e.target.value)}>
            {PICKUP_LOCATIONS.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </Select>
          <Input
            label="Pickup Date"
            type="date"
            min={todayYmd}
            value={pickupDate}
            onChange={(e) => {
              const v = e.target.value
              setPickupDate(v)
              if (dropoffDate && v && dropoffDate <= v) {
                setDropoffDate(addDaysYmd(v, 1))
              }
            }}
          />
          <Input
            label="Dropoff Date"
            type="date"
            min={dropoffMin ? addDaysYmd(dropoffMin, 1) : todayYmd}
            value={dropoffDate}
            onChange={(e) => setDropoffDate(e.target.value)}
          />
          <Button type="button" size="lg" className="w-full shrink-0" disabled={isPending} onClick={onSearch}>
            {isPending ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Searching…
              </span>
            ) : (
              <>
                <Search className="h-4 w-4" aria-hidden />
                Search Cars
              </>
            )}
          </Button>
        </div>
        <div className="mt-4">
          <Input
            label="Brand or model (optional)"
            placeholder="e.g. BMW, Creta, electric"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
          />
        </div>
        {error ? (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-400/25 bg-amber-500/[0.08] px-3 py-2 text-sm text-amber-50/95">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>{error}</span>
          </div>
        ) : null}
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
