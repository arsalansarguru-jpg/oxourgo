'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

import { useSupabase } from '@/hooks/use-supabase'

/** Subscribes to booking row updates so customers see status changes without manual refresh. */
export function BookingRealtimeSubscriber({ bookingId }: { bookingId: string }) {
  const supabase = useSupabase()
  const router = useRouter()

  useEffect(() => {
    if (!supabase) return

    const channel = supabase
      .channel(`booking-updates-${bookingId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'bookings', filter: `id=eq.${bookingId}` },
        () => {
          router.refresh()
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [bookingId, router, supabase])

  return null
}
