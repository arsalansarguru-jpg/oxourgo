import { Loader2 } from 'lucide-react'

export default function AdminLoading() {
  return (
    <div className="flex min-h-[32vh] flex-col items-center justify-center gap-3" aria-busy="true" aria-label="Loading">
      <Loader2 className="h-8 w-8 animate-spin text-electric" />
      <p className="text-xs text-muted">Loading…</p>
    </div>
  )
}
