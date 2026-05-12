import 'server-only'

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/database.types'

export type PaymentEventRow = Database['public']['Tables']['payment_events']['Row']

export async function listPaymentEvents(userId: string): Promise<PaymentEventRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('payment_events')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error || !data) return []
  return data as PaymentEventRow[]
}
