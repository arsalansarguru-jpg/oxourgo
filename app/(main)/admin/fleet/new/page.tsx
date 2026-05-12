import Link from 'next/link'

import { AdminNewCarForm } from '@/components/admin/admin-new-car-form'
import { AdminPageHeader } from '@/components/admin/admin-page-header'

export default function AdminFleetNewPage() {
  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Fleet"
        title="Add vehicle"
        description="Inserts a new row into public.cars. Registration must be unique."
      />
      <AdminNewCarForm />
      <p className="text-center text-sm text-muted">
        <Link href="/admin/fleet" className="text-electric hover:underline">
          ← Fleet list
        </Link>
      </p>
    </div>
  )
}
