import Image from 'next/image'
import Link from 'next/link'

import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { adminListCars } from '@/lib/admin/data/fleet'
import { getPublicStorageObjectUrl } from '@/lib/supabase/storage-public-url'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { AdminStatusPill } from '@/components/admin/admin-status-pill'
import { cn } from '@/lib/utils/cn'
import { cardSurfaceBase } from '@/components/ui/card-tokens'
import { formatInr } from '@/lib/format'

export const dynamic = 'force-dynamic'

export default async function AdminFleetPage() {
  let cars: Awaited<ReturnType<typeof adminListCars>> = []
  try {
    cars = await adminListCars()
  } catch {
    cars = []
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <AdminPageHeader
          eyebrow="Fleet"
          title="Vehicles"
          description="Create, price, feature, and publish fleet rows backed by Supabase."
        />
        <Button to="/admin/fleet/new">Add vehicle</Button>
      </div>

      <Card className={cn(cardSurfaceBase, 'overflow-hidden border border-white/[0.08]')}>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-white/[0.08] bg-white/[0.03] text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Vehicle</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Price / day</th>
                  <th className="px-4 py-3 font-medium">Featured</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {cars.map((c) => {
                  const thumb = c.cover_image_path ? getPublicStorageObjectUrl('fleet', c.cover_image_path) : null
                  return (
                    <tr key={c.id} className="border-b border-white/[0.05] hover:bg-white/[0.02]">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-lg border border-white/[0.08] bg-white/5">
                            {thumb ? (
                              <Image src={thumb} alt="" fill sizes="64px" className="object-cover" />
                            ) : (
                              <div className="flex h-full items-center justify-center text-[10px] text-muted">—</div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-soft">
                              {c.brand} {c.model}
                            </p>
                            <p className="text-xs text-muted">{c.registration_number}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <AdminStatusPill value={c.availability_status} />
                      </td>
                      <td className="px-4 py-3 tabular-nums text-soft">{formatInr(c.pricing_per_day)}</td>
                      <td className="px-4 py-3 text-muted">{c.featured ? 'Yes' : 'No'}</td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/admin/fleet/${c.id}`} className="text-electric hover:underline">
                          Manage
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {cars.length === 0 ? (
            <p className="p-6 text-sm text-muted">No vehicles loaded — check service role key and migration.</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
