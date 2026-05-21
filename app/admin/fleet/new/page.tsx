import { redirect } from 'next/navigation'

export default function AdminFleetNewPage() {
  redirect('/admin/fleet?add=1')
}
