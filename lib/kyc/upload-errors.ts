import type { PostgrestError } from '@supabase/supabase-js'
import type { StorageError } from '@supabase/storage-js'

import { SAFE_USER_MESSAGE } from '@/lib/errors/safe-user-message'
import { logPostgrestError } from '@/lib/errors/safe-user-message'

export type KycUploadFailureCode =
  | 'session_expired'
  | 'forbidden'
  | 'file_too_large'
  | 'duplicate'
  | 'network'
  | 'invalid_file'
  | 'upload_failed'

export class KycUploadError extends Error {
  readonly code: KycUploadFailureCode

  constructor(code: KycUploadFailureCode, message: string) {
    super(message)
    this.name = 'KycUploadError'
    this.code = code
  }
}

const KYC_UPLOAD_MESSAGES: Record<KycUploadFailureCode, string> = {
  session_expired: SAFE_USER_MESSAGE.unauthorized,
  forbidden: 'Unable to upload to your private vault. Sign in again and retry.',
  file_too_large: 'File must be 8MB or smaller.',
  duplicate: 'This file was already uploaded. Choose the file again and retry.',
  network: 'Network error while uploading. Check your connection and try again.',
  invalid_file: 'Please upload a PDF or an image (JPEG, PNG, or WebP).',
  upload_failed: 'Upload failed. Please try again.',
}

export function safeMessageForKycUploadCode(code: KycUploadFailureCode): string {
  return KYC_UPLOAD_MESSAGES[code]
}

/** Surfaces short Supabase messages when they are safe for customers. */
export function sanitizeSupabaseMessageForUser(message: string | undefined | null): string | null {
  const trimmed = message?.trim()
  if (!trimmed || trimmed.length > 160) return null

  const lower = trimmed.toLowerCase()
  if (
    lower.includes('relation') ||
    lower.includes('column') ||
    lower.includes('syntax error') ||
    lower.includes('postgres') ||
    lower.includes('pgrst') ||
    lower.includes('internal server')
  ) {
    return null
  }

  return trimmed
}

export function mapStorageErrorToKycUpload(error: StorageError): KycUploadError {
  const status = Number(error.statusCode) || 0
  const msg = (error.message ?? '').toLowerCase()
  const raw = error.message?.trim()

  if (status === 401 || msg.includes('jwt') || msg.includes('not authenticated')) {
    return new KycUploadError('session_expired', KYC_UPLOAD_MESSAGES.session_expired)
  }
  if (status === 403 || msg.includes('policy') || msg.includes('row-level security')) {
    return new KycUploadError('forbidden', KYC_UPLOAD_MESSAGES.forbidden)
  }
  if (status === 413 || msg.includes('too large') || msg.includes('payload')) {
    return new KycUploadError('file_too_large', KYC_UPLOAD_MESSAGES.file_too_large)
  }
  if (status === 409 || msg.includes('already exists') || msg.includes('duplicate')) {
    return new KycUploadError('duplicate', KYC_UPLOAD_MESSAGES.duplicate)
  }
  if (
    msg.includes('mime') ||
    msg.includes('content type') ||
    msg.includes('not allowed') ||
    msg.includes('invalid file type')
  ) {
    const friendly =
      sanitizeSupabaseMessageForUser(raw) ??
      'This file type is not allowed. Use JPEG, PNG, WebP, HEIC, or PDF.'
    return new KycUploadError('invalid_file', friendly)
  }
  if (msg.includes('network') || msg.includes('fetch') || msg.includes('timeout') || msg.includes('connection')) {
    return new KycUploadError('network', KYC_UPLOAD_MESSAGES.network)
  }

  const safe = sanitizeSupabaseMessageForUser(raw)
  if (safe) {
    return new KycUploadError('upload_failed', safe)
  }

  return new KycUploadError('upload_failed', KYC_UPLOAD_MESSAGES.upload_failed)
}

export function mapUnknownToKycUpload(error: unknown): KycUploadError {
  if (error instanceof KycUploadError) return error
  if (error instanceof Error && error.message === 'Upload cancelled.') {
    return new KycUploadError('upload_failed', 'Upload cancelled.')
  }
  if (error instanceof Error) {
    const safe = sanitizeSupabaseMessageForUser(error.message)
    if (safe) return new KycUploadError('upload_failed', safe)
  }
  return new KycUploadError('upload_failed', KYC_UPLOAD_MESSAGES.upload_failed)
}

/** Server action: log Postgrest failure, return KYC-specific copy when possible. */
export function kycActionDbFailed(
  scope: string,
  error: PostgrestError,
): { ok: false; message: string } {
  logPostgrestError(scope, error)

  const code = error.code ?? ''
  const details = (error.details ?? '').toLowerCase()
  const message = (error.message ?? '').toLowerCase()
  const safeRaw = sanitizeSupabaseMessageForUser(error.message)

  if (code === '42501' || code === 'PGRST301') {
    return { ok: false, message: SAFE_USER_MESSAGE.unauthorized }
  }
  if (code === '23505') {
    return { ok: false, message: 'This document is already on file. Refresh the page if it does not appear.' }
  }
  if (code === '23514' || code === '22P02') {
    return {
      ok: false,
      message: safeRaw ?? 'Invalid document details. Choose another file and try again.',
    }
  }
  if (code === 'PGRST116') {
    return {
      ok: false,
      message: 'Upload saved but could not be confirmed. Refresh the page — if it still fails, sign in again.',
    }
  }
  if (
    code === 'PGRST204' ||
    code === '42703' ||
    details.includes('column') ||
    message.includes('column')
  ) {
    console.error(`[${scope}] schema mismatch — apply latest Supabase migrations`, error)
    return {
      ok: false,
      message:
        'KYC storage is not fully configured on the server. Our team has been notified — try again shortly or contact support.',
    }
  }

  if (safeRaw) {
    return { ok: false, message: safeRaw }
  }

  return { ok: false, message: SAFE_USER_MESSAGE.save }
}

export function kycStorageVerifyFailedMessage(): string {
  return kycStorageObjectMissingMessage()
}

export function kycStorageObjectMissingMessage(): string {
  return 'Upload did not finish securely. Please choose the file again.'
}
