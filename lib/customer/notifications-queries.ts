import 'server-only'

import { createClient } from '@/lib/supabase/server'
import type { NotificationRow } from '@/lib/supabase/database.types'

export async function listNotificationsForUser(userId: string, limit = 100): Promise<NotificationRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error || !data) return []
  return data as NotificationRow[]
}

export async function countUnreadNotifications(userId: string): Promise<number> {
  const supabase = await createClient()
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .is('read_at', null)

  if (error) return 0
  return count ?? 0
}
