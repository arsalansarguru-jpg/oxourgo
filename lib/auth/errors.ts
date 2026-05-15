import { SAFE_USER_MESSAGE } from '@/lib/errors/safe-user-message'

export type AuthErrorCode = 'unauthorized' | 'forbidden'

const MESSAGES: Record<AuthErrorCode, string> = {
  unauthorized: SAFE_USER_MESSAGE.unauthorized,
  forbidden: 'You do not have permission to access this area.',
}

export class AuthError extends Error {
  readonly code: AuthErrorCode
  readonly userMessage: string

  constructor(code: AuthErrorCode, userMessage?: string) {
    super(userMessage ?? MESSAGES[code])
    this.name = 'AuthError'
    this.code = code
    this.userMessage = userMessage ?? MESSAGES[code]
  }
}

export function isAuthError(error: unknown): error is AuthError {
  return error instanceof AuthError
}

export function authErrorToUserMessage(error: unknown): string {
  if (isAuthError(error)) return error.userMessage
  if (error instanceof Error && error.message === 'Unauthorized') {
    return MESSAGES.unauthorized
  }
  if (error instanceof Error && error.message === 'Forbidden') {
    return MESSAGES.forbidden
  }
  return SAFE_USER_MESSAGE.generic
}
