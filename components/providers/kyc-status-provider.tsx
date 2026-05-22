'use client'

import { createContext, useContext, type ReactNode } from 'react'

import type { KycUiSnapshot } from '@/lib/kyc/kyc-ui-snapshot'

const KycStatusContext = createContext<KycUiSnapshot | null>(null)

export function KycStatusProvider({
  value,
  children,
}: {
  value: KycUiSnapshot
  children: ReactNode
}) {
  return <KycStatusContext.Provider value={value}>{children}</KycStatusContext.Provider>
}

/** Single authoritative KYC presentation for all dashboard client surfaces. */
export function useKycStatus(): KycUiSnapshot {
  const ctx = useContext(KycStatusContext)
  if (!ctx) {
    throw new Error('useKycStatus must be used within KycStatusProvider (dashboard layout).')
  }
  return ctx
}
