/**
 * Sync State Aggregate Root - Client Interface
 * 全局同步状态聚合根（客户端�?
 */

import type { SyncProfileId, SyncSessionId, TransferDate } from '@/primitives';
import type { SyncGlobalStatus } from '../value-objects/sync-global-status';

// ============ DTO 定义 ============

export interface SyncStateClientDTO {
  globalStatus: SyncGlobalStatus;
  currentDeviceId: string | null;
  currentDeviceName: string | null;
  activeProfileId: string | null;
  activeProfileName: string | null;
  currentSessionId: string | null;
  statusLabel: 'idle' | 'syncing' | 'error' | 'offline' | 'conflict';
  statusDescription: string | null;
  pendingChangesCount: number;
  unresolvedConflictsCount: number;
  lastSyncAt: TransferDate | null;
  lastSyncAtFormatted: string | null;
  lastSyncResult: 'success' | 'failed' | 'partial' | null;
  isLocked: boolean | null;
  isOnline: boolean;
  otherDevicesCount: number | null;
}

// ============ 接口定义 ============

export interface SyncStateClient {
  currentDeviceId: string;
  currentDeviceName: string;
  statusLabel: 'idle' | 'syncing' | 'error' | 'offline' | 'conflict';
  pendingChangesCount: number;
  isOnline: boolean;

}
