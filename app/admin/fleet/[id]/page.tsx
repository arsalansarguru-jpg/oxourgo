import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { AdminVehicleFieldsForm } from '@/components/admin/admin-vehicle-fields-form'
import { AdminVehicleOps } from '@/components/admin/admin-vehicle-ops'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { adminGetVehicle } from '@/lib/admin/data/fleet'
import { fleetVehicleImageUrl } from '@/lib/admin/fleet-image-url'

export const dynamic = 'force-dynamic'

export default async function AdminFleetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  let vehicle: Awaited<ReturnType<typeof adminGetVehicle>> = null
  try {
    vehicle = await adminGetVehicle(id)
  } catch {
    vehicle = null
  }
  if (!vehicle) notFound()

  const cover = fleetVehicleImageUrl(vehicle.image)

  const subtitleParts = [
    vehicle.brand,
    vehicle.year ? String(vehicle.year) : null,
    vehicle.registration_number,
    `ID ${vehicle.id}`
  ].filter((x) => x !== null && x !== undefined && String(x).trim() !== '' && String(x) !== 'null')
  const subtitle = subtitleParts.join(' · ')

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Fleet"
        title={vehicle.name}
        description={subtitle}
      />

      {cover ? (
        <div className="relative h-56 w-full overflow-hidden rounded-2xl border border-white/[0.08] shadow-[var(--shadow-card)] sm:h-64">
          <Image src={cover} alt="" fill sizes="100vw" className="object-cover" priority unoptimized />
        </div>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-2">
        <AdminVehicleFieldsForm vehicle={vehicle} />
        <AdminVehicleOps vehicle={vehicle} />
      </div>

      <p className="text-center text-sm text-muted">
        <Link href="/admin/fleet" className="text-electric hover:underline">
          ← Fleet list
        </Link>
      </p>
    </div>
  )
}
