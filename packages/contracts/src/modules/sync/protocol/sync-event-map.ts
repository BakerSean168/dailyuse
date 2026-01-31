// 定义 Sync 模块发出的事件
export type SyncEventMap = {
  // SyncProfile 事件
  'sync-profile:created': { profileId: string; name: string; providerType: string };
  'sync-profile:connected': { profileId: string; providerType: string };

  // SyncSession 事件
  'sync-session:created': { sessionId: string; profileId: string; direction: string; triggerType: string };
  'sync-session:completed': { sessionId: string; totalChanges: number; durationMs: number };
  'sync-session:failed': { sessionId: string; errorCode: string; errorMessage: string };
};
