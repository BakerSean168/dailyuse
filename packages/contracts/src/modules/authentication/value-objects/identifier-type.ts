export const IdentifierType = {
  EMAIL: 'EMAIL',
  PHONE: 'PHONE',
} as const;
export type IdentifierType = (typeof IdentifierType)[keyof typeof IdentifierType];