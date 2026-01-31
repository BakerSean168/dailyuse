export const CredentialType = {
  PASSWORD: 'PASSWORD',
  OAUTH: 'OAUTH',
  PHONE: 'PHONE',
  MAGIC_LINK: 'MAGIC_LINK'
} as const;
export type CredentialType = keyof typeof CredentialType;
