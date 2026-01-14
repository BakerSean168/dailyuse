/**
 * Sync Session Aggregate Root - Client Interface
 * 同步会话聚合根（客户端）
 */

import type { SyncSessionStatus, SyncDirection, SyncStrategy, SyncTriggerType } from '../enums';
import type { SyncSessionStatsDTO } from '../value-objects';

// ============ DTO 定义 ============

export interface SyncSessionClientDTO {
  uuid: string;
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
  statistics?: SyncSessionStatsDTO | null;
  error?: { code: string; message: string } | null;
  canRetry: boolean;
  createdAt: number;
  startedAt?: number | null;
  completedAt?: number | null;
  estimatedTimeRemaining?: number | null;
}

// ============ 接口定义 ============

export interface SyncSessionClient {
  uuid: string;
  profileId: string;
  status: SyncSessionStatus;
  progress: number;
  conflictCount: number;
  processedCount: number;
  totalCount: number;
  canRetry: boolean;
  estimatedTimeRemaining?: number | null;

  isInProgress(): boolean;
  isCompleted(): boolean;
  isFailed(): boolean;

  toClientDTO(): SyncSessionClientDTO;
}

export interface SyncSessionClientStatic {
  fromClientDTO(dto: SyncSessionClientDTO): SyncSessionClient;
}
