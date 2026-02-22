export const CredentialType = {
  PASSWORD: 'PASSWORD',
  MAGIC_LINK: 'MAGIC_LINK',
  OAUTH: 'OAUTH',
} as const;
export type CredentialType = keyof typeof CredentialType;
