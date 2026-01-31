/**
 * 凭证状态
 */
export const  CredentialStatus = {
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  EXPIRED: 'EXPIRED',
  REVOKED: 'REVOKED',
} as const;
export type CredentialStatus = keyof typeof CredentialStatus;
