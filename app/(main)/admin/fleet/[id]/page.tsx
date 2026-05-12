import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { AdminCarFieldsForm } from '@/components/admin/admin-car-fields-form'
import { AdminCarOps } from '@/components/admin/admin-car-ops'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { adminGetCar } from '@/lib/admin/data/fleet'
import { getPublicStorageObjectUrl } from '@/lib/supabase/storage-public-url'

export const dynamic = 'force-dynamic'

export default async function AdminFleetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  let car: Awaited<ReturnType<typeof adminGetCar>> = null
  try {
    car = await adminGetCar(id)
  } catch {
    car = null
  }
  if (!car) notFound()

  const cover = car.cover_image_path ? getPublicStorageObjectUrl('fleet', car.cover_image_path) : null

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Fleet"
        title={`${car.brand} ${car.model}`}
        description={`Registration ${car.registration_number} · ID ${car.id}`}
      />

      {cover ? (
        <div className="relative h-64 w-full overflow-hidden rounded-2xl border border-white/[0.08]">
          <Image src={cover} alt="" fill sizes="100vw" className="object-cover" priority />
        </div>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-2">
        <AdminCarFieldsForm car={car} />
        <AdminCarOps car={car} />
      </div>

      <p className="text-center text-sm text-muted">
        <Link href="/admin/fleet" className="text-electric hover:underline">
          ← Fleet list
        </Link>
      </p>
    </div>
  )
}
