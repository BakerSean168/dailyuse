/**
 * Residual 949: sole maskEmail helper body for authentication server logging / DTO masking.
 * Register, GetCurrentUser, and ConsoleEmailSender import this; local duals retired.
 * Invalid shapes return '***' (never leak raw input).
 */

/**
 * Mask an email for logs and client-facing emailMasked fields.
 * Invalid / incomplete addresses collapse to '***' (no raw leak).
 */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return '***';
  if (local.length <= 2) return `${local[0] ?? '*'}***@${domain}`;
  return `${local[0]}***${local.slice(-1)}@${domain}`;
}
