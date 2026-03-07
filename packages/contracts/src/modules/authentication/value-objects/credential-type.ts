export const CredentialType = {
  Password: 'Password',
  MagicLink: 'MagicLink',
  OAuth: 'OAuth',
  Phone: 'Phone',
} as const;
export type CredentialType = (typeof CredentialType)[keyof typeof CredentialType];
