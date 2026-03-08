export const CredentialType = {
  Password: 'Password',
  MagicLink: 'MagicLink',
} as const;
export type CredentialType = (typeof CredentialType)[keyof typeof CredentialType];
