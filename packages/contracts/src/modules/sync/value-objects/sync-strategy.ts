/**
 * 同步策略
 */
export const SyncStrategy = {
  Full: 'Full',
  Incremental: 'Incremental',
  Auto: 'Auto',
} as const;

export type SyncStrategy = (typeof SyncStrategy)[keyof typeof SyncStrategy];
