/**
 * 全局同步状态
 */
export const SyncGlobalStatus = {
  Idle: 'Idle',
  Pending: 'Pending',
  Syncing: 'Syncing',
  Conflict: 'Conflict',
  Error: 'Error',
  Offline: 'Offline',
} as const;

export type SyncGlobalStatus = (typeof SyncGlobalStatus)[keyof typeof SyncGlobalStatus];
