export const CredentialType = {
  PASSWORD: 'PASSWORD',
  MAGIC_LINK: 'MAGIC_LINK',
  OAUTH: 'OAUTH',
  PHONE: 'PHONE',
} as const;
export type CredentialType = (typeof CredentialType)[keyof typeof CredentialType];
