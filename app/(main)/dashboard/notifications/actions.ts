'use server'

import { revalidatePath } from 'next/cache'

import { getAuthenticatedUser } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'

export async function markNotificationReadAction(notificationId: string): Promise<{ ok: boolean; message?: string }> {
  const user = await getAuthenticatedUser()
  if (!user) return { ok: false, message: 'Unauthorized' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId)
    .eq('user_id', user.id)

  if (error) return { ok: false, message: error.message }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/notifications')
  return { ok: true }
}

export async function markAllNotificationsReadAction(formData: FormData): Promise<void> {
  try {
    void formData
    const user = await getAuthenticatedUser()
    if (user) {
      const supabase = await createClient()
      const now = new Date().toISOString()
      const { error } = await supabase.from('notifications').update({ read_at: now }).eq('user_id', user.id).is('read_at', null)

      if (error) {
        console.error('Failed to mark notifications as read:', error)
      } else {
        revalidatePath('/dashboard')
        revalidatePath('/dashboard/notifications')
      }
    }
  } catch (error) {
    console.error('Failed to mark notifications as read:', error)
  }
}
