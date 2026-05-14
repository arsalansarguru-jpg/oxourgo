/** KYC document types persisted in `public.kyc_documents.document_type`. */
export const KYC_DOCUMENT_TYPES = ['aadhaar', 'license', 'passport', 'selfie', 'pan'] as const

export type KycDocumentTypeId = (typeof KYC_DOCUMENT_TYPES)[number]

export const KYC_MAX_FILE_BYTES = 8 * 1024 * 1024

export const KYC_ID_ACCEPT = 'image/jpeg,image/png,image/webp,image/heic,image/heif,.pdf,application/pdf'

export const KYC_SELFIE_ACCEPT = 'image/jpeg,image/png,image/webp'
