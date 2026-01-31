/**
 * 同步触发方式
 */
export const SyncTriggerType = {
  Manual: 'Manual',
  AutoScheduled: 'AutoScheduled',
  OnChange: 'OnChange',
  OnStartup: 'OnStartup',
  OnNetworkRestore: 'OnNetworkRestore',
} as const;

export type SyncTriggerType = (typeof SyncTriggerType)[keyof typeof SyncTriggerType];
