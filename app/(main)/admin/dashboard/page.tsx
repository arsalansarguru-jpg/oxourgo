import { redirect } from 'next/navigation'

/** Legacy alias — enterprise dashboard lives at `/admin`. */
export default function AdminDashboardAliasPage() {
  redirect('/admin')
}
