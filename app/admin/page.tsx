import { redirect } from 'next/navigation'

import { ADMIN_HOME } from '@/lib/auth/routes'

/** Admin console root → command center. */
export default function AdminRootPage() {
  redirect(ADMIN_HOME)
}
