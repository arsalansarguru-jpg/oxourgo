import type { AuthError } from '@supabase/supabase-js'

import { SAFE_USER_MESSAGE } from '@/lib/errors/safe-user-message'

/**
 * Maps Supabase Auth errors to user-safe copy. Raw messages are never returned;
 * unknown errors log to console and fall back to a generic line.
 */
export function formatAuthError(error: AuthError | Error | null | undefined): string {
  if (!error) return SAFE_USER_MESSAGE.generic

  const msg = 'message' in error ? error.message : String(error)
  const code = 'status' in error ? String((error as AuthError).status) : ''

  const lower = msg.toLowerCase()

  if (lower.includes('invalid login credentials') || lower.includes('invalid_credentials')) {
    return 'Those sign-in details did not match our records.'
  }
  if (lower.includes('email not confirmed')) {
    return 'Please confirm your email from the link we sent, then try again.'
  }
  if (lower.includes('rate limit') || lower.includes('too many')) {
    return 'Too many attempts. Please wait a moment and try again.'
  }
  if (lower.includes('otp') && lower.includes('expired')) {
    return 'That code has expired. Request a new one.'
  }
  if (lower.includes('invalid otp') || lower.includes('token')) {
    return 'Invalid or expired code. Check the number and try again.'
  }
  if (lower.includes('phone')) {
    return 'We could not use that phone number. Check the format (+91…) and try again.'
  }
  if (lower.includes('signups not allowed') || lower.includes('signup_disabled')) {
    return 'New sign-ups are paused. Please contact support.'
  }
  if (lower.includes('provider') && lower.includes('not enabled')) {
    return 'That sign-in method is not enabled yet. Try email or mobile OTP.'
  }

  if (code === '400' || code === '422') {
    return 'We could not complete that request. Check your input and try again.'
  }

  console.error('[formatAuthError] unmapped auth error', msg, code)
  return SAFE_USER_MESSAGE.generic
}
