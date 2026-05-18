'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, Loader2, Search } from 'lucide-react'

import { PICKUP_HUB } from '@/lib/booking/constants'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

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

function defaultTripDates(): { pickup: string; dropoff: string } {
  const today = toYmd(new Date())
  return { pickup: today, dropoff: addDaysYmd(today, 2) }
}

export function BookingSearchBar() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const initialDates = useMemo(() => defaultTripDates(), [])
  const [pickupDate, setPickupDate] = useState(initialDates.pickup)
  const [dropoffDate, setDropoffDate] = useState(initialDates.dropoff)
  const [keywords, setKeywords] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [touched, setTouched] = useState({ pickup: false, dropoff: false })

  const todayYmd = useMemo(() => toYmd(new Date()), [])
  const dropoffMin = pickupDate || todayYmd

  const onSearch = () => {
    setError(null)
    setTouched({ pickup: true, dropoff: true })
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
      setError('Enter valid dates (YYYY-MM-DD).')
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
    q.set('from', pickupDate)
    q.set('to', dropoffDate)
    const kw = keywords.trim()
    if (kw) q.set('q', kw)

    startTransition(() => {
      router.push(`/fleet?${q.toString()}`)
    })
  }

  const syncPickup = (raw: string) => {
    setPickupDate(raw)
    if (dropoffDate && raw && dropoffDate <= raw) {
      setDropoffDate(addDaysYmd(raw, 1))
    }
  }

  return (
    <div className="w-full min-w-0">
      <div className="rounded-3xl border border-white/14 bg-[#fff8ec]/95 p-4 shadow-[0_30px_80px_-42px_rgba(0,0,0,0.75)] backdrop-blur-xl sm:p-5">
        <p className="mb-4 text-sm text-[#5c4a32]">
          All vehicles are collected from our <span className="font-semibold text-[#2a2118]">{PICKUP_HUB}</span> hub.
        </p>
        <div
          className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:items-end"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              onSearch()
            }
          }}
        >
          <Input
            label="Pickup date"
            type="date"
            name="pickupDate"
            min={todayYmd}
            value={pickupDate}
            onChange={(e) => syncPickup(e.target.value)}
            onBlur={(e) => {
              setTouched((t) => ({ ...t, pickup: true }))
              syncPickup(e.target.value)
            }}
          />
          <Input
            label="Return date"
            type="date"
            name="dropoffDate"
            min={dropoffMin ? addDaysYmd(dropoffMin, 1) : todayYmd}
            value={dropoffDate}
            onChange={(e) => setDropoffDate(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, dropoff: true }))}
          />
          <Button type="button" size="lg" className="w-full shrink-0 sm:col-span-2 lg:col-span-1" disabled={isPending} onClick={onSearch}>
            {isPending ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Searching…
              </span>
            ) : (
              <>
                <Search className="h-4 w-4" aria-hidden />
                Search fleet
              </>
            )}
          </Button>
        </div>
        <div className="mt-4">
          <Input
            label="Brand or model (optional)"
            placeholder="e.g. BMW, Mercedes, Thar"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                onSearch()
              }
            }}
          />
        </div>
        {error && (touched.pickup || touched.dropoff) ? (
          <div className="mt-4 flex items-start gap-2 rounded-2xl border border-amber-400/40 bg-amber-100 px-3 py-2 text-sm text-amber-900">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>{error}</span>
          </div>
        ) : null}
      </div>
    </div>
  )
}

