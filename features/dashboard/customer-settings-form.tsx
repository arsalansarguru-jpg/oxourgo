'use client'

import { useState, useTransition } from 'react'
import { Loader2 } from 'lucide-react'

import { updateCustomerProfileAction } from '@/app/(main)/dashboard/actions'
import type { Database } from '@/lib/supabase/database.types'
import type { User } from '@supabase/supabase-js'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent } from '@/components/ui/Card'
import { cardSurfaceHover, cardSurfaceTransition } from '@/components/ui/card-tokens'
import { cn } from '@/lib/utils/cn'

function validateIndianMobile(raw: string): string | null {
  const t = raw.trim()
  if (!t) return null
  const digits = t.replace(/\D/g, '')
  if (t.startsWith('+')) {
    if (digits.startsWith('91') && digits.length === 12 && /^[6-9]/.test(digits.slice(2))) return null
    return 'Use +91 followed by a valid 10-digit Indian mobile.'
  }
  if (digits.length === 10 && /^[6-9]/.test(digits)) return null
  if (digits.length === 12 && digits.startsWith('91') && /^[6-9]/.test(digits.slice(2))) return null
  return 'Enter a 10-digit mobile or +91… format.'
}

type Profile = Database['public']['Tables']['profiles']['Row'] | null

export function CustomerSettingsForm({ user, profile }: { user: User; profile: Profile }) {
  const [fullName, setFullName] = useState(profile?.full_name ?? (user.user_metadata?.full_name as string) ?? '')
  const [phone, setPhone] = useState(profile?.phone ?? '')
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? '')
  const [message, setMessage] = useState<string | null>(null)
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    setFieldError(null)
    const phoneErr = validateIndianMobile(phone)
    if (phoneErr) {
      setFieldError(phoneErr)
      return
    }
    const fd = new FormData()
    fd.set('fullName', fullName)
    fd.set('phone', phone)
    fd.set('avatarUrl', avatarUrl)
    startTransition(async () => {
      const res = await updateCustomerProfileAction(fd)
      setMessage(res.ok ? 'Saved.' : res.message ?? 'Could not save.')
    })
  }

  return (
    <div className="space-y-8">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-electric/90">Account</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-soft">Profile settings</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Identity details are saved securely to your account and used only for reservations and support.
        </p>
      </header>

      <Card className={cn(cardSurfaceTransition, cardSurfaceHover)}>
        <CardContent className="p-5 sm:p-6">
          <form className="space-y-5" onSubmit={onSubmit}>
            <Input label="Email (read-only)" value={user.email ?? ''} readOnly disabled />
            <Input label="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} name="fullName" />
            <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} name="phone" placeholder="+91 9xxxx xxxxx or 10-digit mobile" />
            <p className="text-xs text-muted">
              Profile photo: paste a public HTTPS image URL. Hosted file upload from this screen is planned next.
            </p>
            <Input
              label="Profile image URL"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              name="avatarUrl"
              placeholder="https://…"
            />
            {fieldError ? <p className="text-sm text-amber-200/95">{fieldError}</p> : null}
            {message ? <p className="text-sm text-muted">{message}</p> : null}
            <Button type="submit" disabled={pending}>
              {pending ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Saving…
                </span>
              ) : (
                'Save changes'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
