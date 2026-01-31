/**
 * Sync Session Aggregate Root - Client Interface
 * 同步会话聚合根（客户端）
 */

import type { SyncSessionId, SyncProfileId, TransferDate } from '@/primitives';
import type { SyncSessionStatus } from '../value-objects/sync-session-status';
import type { SyncDirection } from '../value-objects/sync-direction';
import type { SyncStrategy } from '../value-objects/sync-strategy';
import type { SyncTriggerType } from '../value-objects/sync-trigger-type';
import type { SyncSessionStatsDTO } from '../value-objects';

// ============ DTO 定义 ============

export interface SyncSessionClientDTO {
  id: string;
  profileId: string;
  status: SyncSessionStatus;
  direction: SyncDirection;
  strategy: SyncStrategy;
  triggerType: SyncTriggerType;
  triggerDeviceName: string;
  progress: number;
  currentEntityDesc?: string;
  conflictCount: number;
  processedCount: number;
  totalCount: number;
  statistics: SyncSessionStatsDTO | null;
  error: { code: string; message: string } | null;
  canRetry: boolean;
  createdAt: TransferDate;
  startedAt: TransferDate | null;
  completedAt: TransferDate | null;
  estimatedTimeRemaining: TransferDate | null;
}

// ============ 接口定义 ============

export interface SyncSessionClient {
  id: SyncSessionId;
  profileId: SyncProfileId;
  status: SyncSessionStatus;
  progress: number;
  conflictCount: number;
  processedCount: number;
  totalCount: number;
  canRetry: boolean;
  estimatedTimeRemaining: number | null;

}
