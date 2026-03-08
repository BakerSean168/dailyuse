export const AccountStatus = {
  Active: 'Active',
  Suspended: 'Suspended',
  Deactivated: 'Deactivated',
} as const;

export type AccountStatus = (typeof AccountStatus)[keyof typeof AccountStatus];
