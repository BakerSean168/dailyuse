/**
 * 凭证状态
 */
export const CredentialStatus = {
  Active: 'Active',
  Suspended: 'Suspended',
  Expired: 'Expired',
  Revoked: 'Revoked',
} as const;
export type CredentialStatus = (typeof CredentialStatus)[keyof typeof CredentialStatus];
