'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'

import { AdminCard, AdminCardContent } from '@/components/admin/admin-card'
import { AdminStatusPill } from '@/components/admin/admin-status-pill'
import { Input } from '@/components/ui/Input'
import { isInternalTestAccount } from '@/lib/admin/test-accounts'
import type { AdminCustomerRow } from '@/lib/admin/data/customers'
import { isLikelyCompanyDisplayName } from '@/lib/customer/company-name-heuristic'

type SortKey = 'name' | 'email' | 'bookings' | 'risk'

const PAGE_SIZE = 25

export function AdminCustomersDirectory({ rows }: { rows: AdminCustomerRow[] }) {
  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortAsc, setSortAsc] = useState(true)
  const [page, setPage] = useState(1)
  const [showInternal, setShowInternal] = useState(false)

  const internalHiddenCount = useMemo(
    () => rows.filter((r) => isInternalTestAccount({ email: r.email, displayName: r.displayName })).length,
    [rows],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = rows
    if (!showInternal) {
      list = list.filter((r) => !isInternalTestAccount({ email: r.email, displayName: r.displayName }))
    }
    if (q) {
      list = list.filter((r) => {
        const hay = `${r.displayName} ${r.email ?? ''} ${r.userId}`.toLowerCase()
        return hay.includes(q)
      })
    }
    const sorted = [...list].sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case 'name':
          cmp = a.displayName.localeCompare(b.displayName)
          break
        case 'email':
          cmp = (a.email ?? '').localeCompare(b.email ?? '')
          break
        case 'bookings':
          cmp = a.bookingCount - b.bookingCount
          break
        case 'risk': {
          const ar = Math.max(a.profile?.risk_score ?? 0, a.heuristicRisk)
          const br = Math.max(b.profile?.risk_score ?? 0, b.heuristicRisk)
          cmp = ar - br
          break
        }
      }
      return sortAsc ? cmp : -cmp
    })
    return sorted
  }, [rows, query, sortKey, sortAsc, showInternal])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((v) => !v)
    else {
      setSortKey(key)
      setSortAsc(true)
    }
  }

  const sortIndicator = (key: SortKey) => (sortKey === key ? (sortAsc ? ' ↑' : ' ↓') : '')

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <Input
          label="Search customers"
          placeholder="Name, email, or user ID"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setPage(1)
          }}
          className="max-w-md"
        />
        <label className="flex flex-col gap-0.5 text-xs text-muted sm:items-end">
          <span className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showInternal}
              onChange={(e) => {
                setShowInternal(e.target.checked)
                setPage(1)
              }}
              className="rounded border-stroke-strong"
            />
            Show internal / test accounts
          </span>
          {internalHiddenCount > 0 ? (
            <span className="text-[11px] text-muted/90">
              {showInternal
                ? `Showing all ${filtered.length} (incl. ${internalHiddenCount} internal)`
                : `${internalHiddenCount} internal account(s) hidden`}
            </span>
          ) : (
            <span className="text-[11px] text-muted/80">No internal accounts in directory</span>
          )}
        </label>
      </div>

      <AdminCard className="overflow-hidden">
        <AdminCardContent className="p-0">
          <div className="overflow-x-auto scroll-touch">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="admin-table-head">
                <tr>
                  <th className="px-4 py-3.5 font-medium">
                    <button type="button" className="hover:text-soft" onClick={() => toggleSort('name')}>
                      Name{sortIndicator('name')}
                    </button>
                  </th>
                  <th className="px-4 py-3.5 font-medium">
                    <button type="button" className="hover:text-soft" onClick={() => toggleSort('email')}>
                      Email{sortIndicator('email')}
                    </button>
                  </th>
                  <th className="px-4 py-3.5 font-medium">Tier</th>
                  <th className="px-4 py-3.5 font-medium">
                    <button type="button" className="hover:text-soft" onClick={() => toggleSort('risk')}>
                      Risk{sortIndicator('risk')}
                    </button>
                  </th>
                  <th className="px-4 py-3.5 font-medium">
                    <button type="button" className="hover:text-soft" onClick={() => toggleSort('bookings')}>
                      Bookings{sortIndicator('bookings')}
                    </button>
                  </th>
                  <th className="px-4 py-3.5 font-medium" />
                </tr>
              </thead>
              <tbody>
                {pageRows.map((r) => {
                  const tier = r.profile?.verification_tier ?? 'basic'
                  const stored = r.profile?.risk_score ?? 0
                  const displayRisk = Math.max(stored, r.heuristicRisk)
                  const nameFlag = isLikelyCompanyDisplayName(r.displayName)
                  const internal = isInternalTestAccount({ email: r.email, displayName: r.displayName })
                  return (
                    <tr key={r.userId} className="admin-table-row">
                      <td className="px-4 py-3 font-medium text-soft">
                        <div className="flex flex-wrap items-center gap-2">
                          <span>{r.displayName}</span>
                          {internal ? (
                            <span className="inline-flex items-center rounded bg-sky-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-sky-300 border border-sky-500/20 shrink-0">
                              Internal
                            </span>
                          ) : null}
                          {nameFlag ? (
                            <span className="inline-flex items-center rounded bg-rose-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-rose-400 border border-rose-500/20 shrink-0">
                              Non-Person / Company
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted">{r.email ?? '—'}</td>
                      <td className="px-4 py-3">
                        <AdminStatusPill value={tier} />
                      </td>
                      <td className="px-4 py-3 tabular-nums text-muted">{displayRisk}</td>
                      <td className="px-4 py-3 text-muted">
                        {r.bookingCount}
                        {r.cancelledCount ? ` · ${r.cancelledCount} cancelled` : ''}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/admin/customers/${r.userId}`}
                          className="font-medium text-electric transition-colors hover:text-electric/85"
                        >
                          Open
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 ? (
            <p className="p-6 text-sm text-muted">No customers match your search.</p>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stroke px-4 py-3 text-xs text-muted">
              <p>
                Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={safePage <= 1}
                  className="rounded-lg border border-stroke px-2.5 py-1 disabled:opacity-40"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </button>
                <span className="tabular-nums">
                  Page {safePage} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={safePage >= totalPages}
                  className="rounded-lg border border-stroke px-2.5 py-1 disabled:opacity-40"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </AdminCardContent>
      </AdminCard>
    </div>
  )
}
