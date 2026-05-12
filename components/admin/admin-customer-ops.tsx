'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

import { adminUpdateCustomerProfileAction } from '@/lib/admin/actions/customer-actions'
import type { Database } from '@/lib/supabase/database.types'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Card, CardContent } from '@/components/ui/Card'
import { cn } from '@/lib/utils/cn'
import { cardSurfaceBase } from '@/components/ui/card-tokens'

type Profile = Database['public']['Tables']['profiles']['Row']

export function AdminCustomerOps({
  userId,
  profile,
}: {
  userId: string
  profile: Profile | null
}) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const tier = profile?.verification_tier ?? 'basic'
  const notes = profile?.admin_notes ?? ''
  const risk = profile?.risk_score ?? 0

  return (
    <Card className={cn(cardSurfaceBase, 'border border-white/[0.08]')}>
      <CardContent className="p-5 sm:p-6">
        <h2 className="mb-4 text-lg font-semibold text-soft">Verification & risk</h2>
        <form
          className="grid gap-4 sm:grid-cols-2"
          action={(fd) => {
            setError(null)
            start(async () => {
              const noteRaw = String(fd.get('admin_notes') ?? '').trim()
              const res = await adminUpdateCustomerProfileAction(userId, {
                verification_tier: String(fd.get('verification_tier')) as Profile['verification_tier'],
                risk_score: Number(fd.get('risk_score') ?? 0),
                admin_notes: noteRaw.length ? noteRaw : null,
              })
              if (!res.ok) {
                setError(res.message)
                return
              }
              router.refresh()
            })
          }}
        >
          <Select name="verification_tier" label="Verification tier" defaultValue={tier}>
            <option value="none">None</option>
            <option value="basic">Basic</option>
            <option value="verified">Verified</option>
          </Select>
          <Input name="risk_score" label="Risk score (0–100)" type="number" min={0} max={100} defaultValue={risk} />
          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-muted" htmlFor="admin_notes">
              Admin notes
            </label>
            <textarea
              id="admin_notes"
              name="admin_notes"
              rows={4}
              defaultValue={notes}
              className="mt-2 w-full rounded-xl border border-white/[0.12] bg-matte/[0.55] px-4 py-3 text-sm text-soft placeholder:text-muted/80 focus:border-electric/55 focus:outline-none focus:ring-2 focus:ring-electric/22"
            />
          </div>
          {error ? <p className="text-sm text-red-300 sm:col-span-2">{error}</p> : null}
          <div className="sm:col-span-2">
            <Button type="submit" disabled={pending}>
              {pending ? 'Saving…' : 'Save profile'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
