/**
 * 同步会话状态
 */
export const SyncSessionStatus = {
  Pending: 'Pending',
  Collecting: 'Collecting',
  Syncing: 'Syncing',
  Conflicted: 'Conflicted',
  Completed: 'Completed',
  Failed: 'Failed',
  Cancelled: 'Cancelled',
} as const;

export type SyncSessionStatus = (typeof SyncSessionStatus)[keyof typeof SyncSessionStatus];
