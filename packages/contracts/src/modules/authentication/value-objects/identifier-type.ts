export const IdentifierType = {
  Email: 'Email',
  Phone: 'Phone',
} as const;
export type IdentifierType = (typeof IdentifierType)[keyof typeof IdentifierType];
