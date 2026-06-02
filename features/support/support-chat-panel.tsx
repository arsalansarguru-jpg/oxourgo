'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Check, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { sendCustomerSupportMessageAction } from '@/lib/customer/actions/support-actions'
import type { SupportMessageRow } from '@/lib/support/types'
import { cn } from '@/lib/utils/cn'
import { cardSurfaceBase, cardSurfaceTransition } from '@/components/ui/card-tokens'

type SupportChatPanelProps = {
  greetingName: string
  initialMessages: SupportMessageRow[]
  signedIn: boolean
}

export function SupportChatPanel({ greetingName, initialMessages, signedIn }: SupportChatPanelProps) {
  const [messages, setMessages] = useState<SupportMessageRow[]>(initialMessages)
  const [chat, setChat] = useState('')
  const [sentHint, setSentHint] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const greet = greetingName.trim() || 'there'

  function handleSend() {
    const text = chat.trim()
    if (!text || pending) return
    if (!signedIn) {
      router.push(`/login?${new URLSearchParams({ redirect: '/support' }).toString()}`)
      return
    }

    setError(null)
    setSentHint(null)
    const optimistic: SupportMessageRow = {
      id: `local-${Date.now()}`,
      conversationId: 'local',
      senderRole: 'customer',
      body: text,
      createdAt: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, optimistic])
    setChat('')

    startTransition(async () => {
      const result = await sendCustomerSupportMessageAction(text)
      if (!result.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== optimistic.id))
        setChat(text)
        setError(result.message)
        return
      }
      setSentHint('Message sent — our Mumbai desk will respond shortly.')
      router.refresh()
    })
  }

  return (
    <>
      {!signedIn ? (
        <p className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-200">
          Sign in to start a saved support conversation. You can still contact us instantly on WhatsApp.
        </p>
      ) : null}
      <div
        className={cn(
          'mt-4 max-h-80 space-y-3 overflow-y-auto p-4',
          cardSurfaceBase,
          cardSurfaceTransition,
          'bg-matte/[0.45]',
        )}
      >
        {messages.length === 0 ? (
          <div className="max-w-[85%] rounded-2xl rounded-bl-md border border-stroke bg-fill-glass px-3 py-2 text-sm text-muted">
            Hi {greet} — I can help with bookings, billing, or roadside. What do you need?
          </div>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={cn(
                'max-w-[85%] rounded-2xl px-3 py-2 text-sm',
                m.senderRole === 'customer'
                  ? 'ml-auto rounded-br-md border border-electric/25 bg-electric/10 text-soft'
                  : 'rounded-bl-md border border-stroke bg-fill-glass text-muted',
              )}
            >
              {m.body}
            </div>
          ))
        )}
      </div>

      <div className="mt-4 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-stretch">
        <Input
          placeholder={signedIn ? 'Ask anything about your trip…' : 'Sign in to message support…'}
          value={chat}
          onChange={(e) => setChat(e.target.value)}
          onFocus={() => {
            if (!signedIn) {
              router.push(`/login?${new URLSearchParams({ redirect: '/support' }).toString()}`)
            }
          }}
          aria-label="Chat message"
          className="min-w-0 flex-1"
          disabled={!signedIn || pending}
        />
        <Button
          type="button"
          variant={signedIn ? 'primary' : 'secondary'}
          className={cn('w-full shrink-0 sm:w-40', !signedIn && 'cursor-not-allowed opacity-50')}
          disabled={pending || !chat.trim()}
          onClick={handleSend}
        >
          {!signedIn ? (
            'Sign in to send'
          ) : pending ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Sending…
            </span>
          ) : (
            'Send'
          )}
        </Button>
      </div>
      {error ? <p className="mt-2 text-xs font-medium text-rose-400">{error}</p> : null}
      {sentHint ? (
        <p className="mt-3 flex items-center gap-2 text-xs font-medium text-emerald">
          <Check className="h-3.5 w-3.5" aria-hidden />
          {sentHint}
        </p>
      ) : (
        <p className="mt-2 text-xs text-silver">
          {signedIn
            ? 'Messages are saved to your support thread. For urgent issues, use WhatsApp or the emergency line.'
            : 'Sign in to start a saved conversation, or use WhatsApp for immediate help.'}
        </p>
      )}
    </>
  )
}
