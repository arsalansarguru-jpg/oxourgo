'use server'

import { revalidatePath } from 'next/cache'

import { getAuthenticatedUser } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'
import { runInstrumentedServerAction } from '@/lib/monitoring/instrument-server-action'

export async function markNotificationReadAction(notificationId: string): Promise<void> {
  return runInstrumentedServerAction('markNotificationReadAction', 'auth', async () => {
    try {
      const user = await getAuthenticatedUser()
      if (!user) return

      const supabase = await createClient()
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('user_id', user.id)

      if (error) {
        console.error('Failed to mark notification read:', error)
        return
      }

      revalidatePath('/dashboard')
      revalidatePath('/dashboard/notifications')
    } catch (error) {
      console.error('Failed to mark notification read:', error)
    }
  })
}

export async function markAllNotificationsReadAction(formData: FormData): Promise<void> {
  return runInstrumentedServerAction('markAllNotificationsReadAction', 'auth', async () => {
    try {
      void formData
      const user = await getAuthenticatedUser()
      if (!user) return

      const supabase = await createClient()
      const now = new Date().toISOString()
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: now })
        .eq('user_id', user.id)
        .is('read_at', null)

      if (error) {
        console.error('Failed to mark notifications as read:', error)
        return
      }

      revalidatePath('/dashboard')
      revalidatePath('/dashboard/notifications')
    } catch (error) {
      console.error('Failed to mark notifications as read:', error)
    }
  })
}
