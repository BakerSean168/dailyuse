/**
 * Sync Session Aggregate Root - Server Interface
 * 同步会话聚合根
 */

import type { SyncSessionStatus, SyncDirection, SyncStrategy, SyncTriggerType } from '../enums';
import type { SyncVersionServerDTO, DeviceInfoDTO, SyncSessionStatsDTO } from '../value-objects';
import type { SyncConflictServerDTO, DataSnapshotServerDTO } from '../entities';
import type { SyncSessionClientDTO } from './SyncSessionClient';

// ============ DTO 定义 ============

export interface SyncSessionServerDTO {
  uuid: string;
  profileId: string;
  status: SyncSessionStatus;
  direction: SyncDirection;
  strategy: SyncStrategy;
  triggerType: SyncTriggerType;
  triggerDevice: DeviceInfoDTO;
  startVersion: SyncVersionServerDTO;
  endVersion?: SyncVersionServerDTO | null;
  localSnapshotId?: string | null;
  remoteSnapshotId?: string | null;
  conflicts?: SyncConflictServerDTO[] | null;
  statistics?: SyncSessionStatsDTO | null;
  error?: { code: string; message: string; details?: unknown; stack?: string } | null;
  canRetry: boolean;
  retryCount: number;
  createdAt: number;
  startedAt?: number | null;
  completedAt?: number | null;
  updatedAt: number;
}

export interface SyncSessionPersistenceDTO {
  uuid: string;
  profileId: string;
  status: string;
  direction: string;
  strategy: string;
  triggerType: string;
  triggerDeviceJson: string;
  startVersionJson: string;
  endVersionJson: string | null;
  localSnapshotId: string | null;
  remoteSnapshotId: string | null;
  statisticsJson: string | null;
  errorJson: string | null;
  canRetry: boolean;
  retryCount: number;
  createdAt: number;
  startedAt: number | null;
  completedAt: number | null;
  updatedAt: number;
}

// ============ 领域事件 ============

export interface SyncSessionCreatedDomainEvent {
  type: 'sync.session.created';
  aggregateId: string;
  timestamp: number;
  payload: { session: SyncSessionServerDTO };
}

export interface SyncSessionCompletedDomainEvent {
  type: 'sync.session.completed';
  aggregateId: string;
  timestamp: number;
  payload: { statistics: SyncSessionStatsDTO; newVersion: SyncVersionServerDTO };
}

export interface SyncSessionFailedDomainEvent {
  type: 'sync.session.failed';
  aggregateId: string;
  timestamp: number;
  payload: { error: { code: string; message: string } };
}

// ============ 接口定义 ============

export interface SyncSessionServer {
  uuid: string;
  profileId: string;
  status: SyncSessionStatus;
  direction: SyncDirection;
  strategy: SyncStrategy;
  triggerType: SyncTriggerType;
  triggerDevice: DeviceInfoDTO;
  startVersion: SyncVersionServerDTO;
  endVersion?: SyncVersionServerDTO | null;
  conflicts?: SyncConflictServerDTO[] | null;
  statistics?: SyncSessionStatsDTO | null;
  error?: { code: string; message: string; details?: unknown } | null;
  canRetry: boolean;
  retryCount: number;
  createdAt: number;
  startedAt?: number | null;
  completedAt?: number | null;
  updatedAt: number;

  // 状态转换
  start(): void;
  complete(stats: SyncSessionStatsDTO, newVersion: SyncVersionServerDTO): void;
  fail(error: { code: string; message: string; details?: unknown }): void;
  cancel(reason?: string): void;

  // 冲突管理
  addConflict(conflict: SyncConflictServerDTO): void;
  resolveConflict(conflictId: string): void;
  hasUnresolvedConflicts(): boolean;

  // 业务查询
  canStart(): boolean;
  canRetrySync(): boolean;
  getDurationMs(): number | null;

  toServerDTO(): SyncSessionServerDTO;
  toClientDTO(): SyncSessionClientDTO;
  toPersistenceDTO(): SyncSessionPersistenceDTO;
}

export interface SyncSessionServerStatic {
  create(params: {
    profileId: string;
    direction: SyncDirection;
    strategy: SyncStrategy;
    triggerType: SyncTriggerType;
    triggerDevice: DeviceInfoDTO;
    startVersion: SyncVersionServerDTO;
  }): SyncSessionServer;
  fromServerDTO(dto: SyncSessionServerDTO): SyncSessionServer;
  fromPersistenceDTO(dto: SyncSessionPersistenceDTO): SyncSessionServer;
}
