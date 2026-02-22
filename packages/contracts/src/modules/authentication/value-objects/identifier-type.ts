export const IdentifierType = {
  EMAIL: 'EMAIL',
  PHONE: 'PHONE',
} as const;
export type IdentifierType = keyof typeof IdentifierType;