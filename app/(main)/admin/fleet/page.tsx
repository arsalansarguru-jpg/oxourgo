import Image from 'next/image'
import Link from 'next/link'

import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { adminListVehicles } from '@/lib/admin/data/fleet'
import { getPublicStorageObjectUrl } from '@/lib/supabase/storage-public-url'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { AdminStatusPill } from '@/components/admin/admin-status-pill'
import { cn } from '@/lib/utils/cn'
import { cardSurfaceBase } from '@/components/ui/card-tokens'
import { formatInr } from '@/lib/format'

export const dynamic = 'force-dynamic'

function thumbUrl(image: string | null | undefined): string | null {
  const raw = image?.trim()
  if (!raw) return null
  if (/^https?:\/\//i.test(raw)) return raw
  return getPublicStorageObjectUrl('fleet', raw)
}

export default async function AdminFleetPage() {
  let vehicles: Awaited<ReturnType<typeof adminListVehicles>> = []
  try {
    vehicles = await adminListVehicles()
  } catch {
    vehicles = []
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <AdminPageHeader
          eyebrow="Fleet"
          title="Vehicles"
          description="Catalog inventory in public.vehicles — pricing, availability, and featuring for the live site."
        />
        <Button to="/admin/fleet/new">Add vehicle</Button>
      </div>

      <Card className={cn(cardSurfaceBase, 'overflow-hidden border border-stroke')}>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-stroke bg-fill-glass text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Vehicle</th>
                  <th className="px-4 py-3 font-medium">Bookable</th>
                  <th className="px-4 py-3 font-medium">Price / day</th>
                  <th className="px-4 py-3 font-medium">Featured</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {vehicles.map((v) => {
                  const thumb = thumbUrl(v.image)
                  const listable = v.available !== false
                  return (
                    <tr key={v.id} className="border-b border-stroke hover:bg-fill-glass">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-lg border border-stroke bg-fill-glass">
                            {thumb ? (
                              <Image src={thumb} alt="" fill sizes="64px" className="object-cover" unoptimized />
                            ) : (
                              <div className="flex h-full items-center justify-center text-[10px] text-muted">—</div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-soft">{v.name}</p>
                            <p className="text-xs text-muted">
                              {v.brand} · {v.registration_number}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <AdminStatusPill value={listable ? 'available' : 'unavailable'} />
                      </td>
                      <td className="px-4 py-3 tabular-nums text-soft">{formatInr(v.price_per_day)}</td>
                      <td className="px-4 py-3 text-muted">{v.featured ? 'Yes' : 'No'}</td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/admin/fleet/${v.id}`} className="text-electric hover:underline">
                          Manage
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {vehicles.length === 0 ? (
            <p className="p-6 text-sm text-muted">No vehicles in this view. Adjust filters or try again shortly.</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
