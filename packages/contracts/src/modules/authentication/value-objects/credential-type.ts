export const CredentialType = {
  PASSWORD: 'PASSWORD',
  MAGIC_LINK: 'MAGIC_LINK'
} as const;
export type CredentialType = keyof typeof CredentialType;
