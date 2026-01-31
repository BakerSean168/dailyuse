/**
 * 仓储状态
 */
export const RepositoryStatus = {
  Active: 'Active',
  Archived: 'Archived',
  Deleted: 'Deleted',
} as const;

export type RepositoryStatus = (typeof RepositoryStatus)[keyof typeof RepositoryStatus];
