/**
 * Sync Domain Event Map
 * 
 * Event Naming Convention: sync:<action>
 * - sync:profile-create - Sync profile created
 * - sync:profile-connect - Sync profile connected
 * - sync:session-create - Sync session created
 * - sync:session-complete - Sync session completed
 * - sync:session-fail - Sync session failed
 */
export type SyncEventMap = {
  // SyncProfile Events
  'sync:profile-create': { profileId: string; name: string; providerType: string };
  'sync:profile-connect': { profileId: string; providerType: string };

  // SyncSession Events
  'sync:session-create': { sessionId: string; profileId: string; direction: string; triggerType: string };
  'sync:session-complete': { sessionId: string; totalChanges: number; durationMs: number };
  'sync:session-fail': { sessionId: string; errorCode: string; errorMessage: string };
};
