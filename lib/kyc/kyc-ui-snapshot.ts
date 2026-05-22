import {
  computeKycLifecycleFromDocuments,
  pickLatestDocPerType,
  type KycDocMinimal,
  type KycLifecycleStatus,
} from '@/lib/kyc/compute-kyc-profile-status'

export type KycUiSnapshot = {
  lifecycleStatus: KycLifecycleStatus
  badgeStatus: KycLifecycleStatus
  sidebarLabel: string
  verificationCardTitle: string
  verificationCardHint: string
  uploadedFileCount: number
}

const LIFECYCLE_VALUES: KycLifecycleStatus[] = [
  'not_started',
  'pending',
  'approved',
  'rejected',
  'resubmission_required',
]

function normalizeLifecycle(raw: string | null | undefined): KycLifecycleStatus {
  const s = (raw ?? 'not_started').trim().toLowerCase()
  return LIFECYCLE_VALUES.includes(s as KycLifecycleStatus) ? (s as KycLifecycleStatus) : 'not_started'
}

function labelsForStatus(status: KycLifecycleStatus, uploadedFileCount: number): Omit<KycUiSnapshot, 'lifecycleStatus' | 'badgeStatus' | 'uploadedFileCount'> {
  if (status === 'approved') {
    return {
      sidebarLabel: 'Account verified',
      verificationCardTitle: 'Cleared',
      verificationCardHint: 'Identity approved for booking',
    }
  }
  if (status === 'pending') {
    return {
      sidebarLabel: 'Verification in review',
      verificationCardTitle: 'In review',
      verificationCardHint: `${uploadedFileCount} file(s) under review`,
    }
  }
  if (status === 'rejected') {
    return {
      sidebarLabel: 'KYC needs your attention',
      verificationCardTitle: 'Action needed',
      verificationCardHint: 'A document was not accepted — see KYC Center',
    }
  }
  if (status === 'resubmission_required') {
    return {
      sidebarLabel: 'KYC needs your attention',
      verificationCardTitle: 'Resubmit documents',
      verificationCardHint: 'Upload clearer files in KYC Center',
    }
  }
  if (uploadedFileCount > 0) {
    return {
      sidebarLabel: 'Verification in progress',
      verificationCardTitle: 'In progress',
      verificationCardHint: `${uploadedFileCount} file(s) uploaded — submit for review when ready`,
    }
  }
  return {
    sidebarLabel: 'Complete your profile',
    verificationCardTitle: 'Not started',
    verificationCardHint: 'Upload license, ID, and selfie in KYC Center',
  }
}

/**
 * Single derived KYC presentation for dashboard badge, sidebar, overview card, and bookings banner.
 */
export function buildKycUiSnapshot(input: {
  profileKycStatus: string | null | undefined
  docs?: KycDocMinimal[]
  bookingCleared?: boolean
}): KycUiSnapshot {
  const uploadedFileCount = input.docs?.length ?? 0
  const latestTypes = input.docs ? pickLatestDocPerType(input.docs).size : 0
  const fromDocs =
    input.docs && input.docs.length > 0 ? computeKycLifecycleFromDocuments(input.docs) : null

  let lifecycleStatus = fromDocs ?? normalizeLifecycle(input.profileKycStatus)

  if (input.bookingCleared && lifecycleStatus !== 'rejected' && lifecycleStatus !== 'resubmission_required') {
    lifecycleStatus = 'approved'
  }

  if (lifecycleStatus === 'not_started' && latestTypes > 0) {
    lifecycleStatus = 'pending'
  }

  const labels = labelsForStatus(lifecycleStatus, uploadedFileCount)

  return {
    lifecycleStatus,
    badgeStatus: lifecycleStatus,
    uploadedFileCount,
    ...labels,
  }
}
