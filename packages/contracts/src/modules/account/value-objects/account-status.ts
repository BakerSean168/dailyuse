export const AccountStatus = {
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  DEACTIVATED: 'DEACTIVATED',
} as const;

export type AccountStatus = typeof AccountStatus[keyof typeof AccountStatus];