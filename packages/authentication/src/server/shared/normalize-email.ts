/**
 * Residual 959: sole normalizeEmail helper for authentication server email challenges.
 * SendEmailVerificationCode + VerifyEmailCode use cases import this; local duals retired.
 * Keeps original casing for repository lookups; challenge store lowercases subjects.
 */

/** Trim email for challenge issue/consume; do not force lowercase. */
export function normalizeEmail(email: string): string {
  // Keep original casing for repository lookups; challenge store lowercases subjects.
  return email.trim();
}
