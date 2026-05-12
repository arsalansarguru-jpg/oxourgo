'use server'

export async function markAllNotificationsReadAction(
  formData: FormData
): Promise<void> {
  try {
    console.log('Mark notifications as read')

    // TODO:
    // keep your Supabase update logic here

  } catch (error) {
    console.error(error)
  }
}
