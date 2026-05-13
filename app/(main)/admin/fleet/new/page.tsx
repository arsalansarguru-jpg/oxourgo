import Link from 'next/link'

import { AdminNewVehicleForm } from '@/components/admin/admin-new-vehicle-form'
import { AdminPageHeader } from '@/components/admin/admin-page-header'

export default function AdminFleetNewPage() {
  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Fleet"
        title="Add vehicle"
        description="Creates a row in public.vehicles for the live catalog and booking flow."
      />
      <AdminNewVehicleForm />
      <p className="text-center text-sm text-muted">
        <Link href="/admin/fleet" className="text-electric hover:underline">
          ← Fleet list
        </Link>
      </p>
    </div>
  )
}
