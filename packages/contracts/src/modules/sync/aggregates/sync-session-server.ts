/**
 * Sync Session Aggregate Root - Server Interface
 * 同步会话聚合�?
 */

import type { SyncSessionId, SyncProfileId, SyncConflictId, DomainDate, PersistenceDate } from '@/primitives';
import type { SyncSessionStatus } from '../value-objects/sync-session-status';
import type { SyncDirection } from '../value-objects/sync-direction';
import type { SyncStrategy } from '../value-objects/sync-strategy';
import type { SyncTriggerType } from '../value-objects/sync-trigger-type';
import type { SyncVersionServerDTO, DeviceInfoDTO, SyncSessionStatsDTO } from '../value-objects';
import type { SyncConflictServerDTO, DataSnapshotServerDTO } from '../entities';
import type { SyncSessionClientDTO } from './sync-session-client';

// ============ DTO 定义 ============

export interface SyncSessionServerDTO {
  id: string;
  profileId: string;
  status: SyncSessionStatus;
  direction: SyncDirection;
  strategy: SyncStrategy;
  triggerType: SyncTriggerType;
  triggerDevice: DeviceInfoDTO;
  startVersion: SyncVersionServerDTO;
  endVersion: SyncVersionServerDTO | null;
  localSnapshotId: string | null;
  remoteSnapshotId: string | null;
  conflicts: SyncConflictServerDTO[] | null;
  statistics: SyncSessionStatsDTO | null;
  error: { code: string; message: string; details?: unknown; stack?: string } | null;
  canRetry: boolean;
  retryCount: number;
  createdAt: DomainDate;
  startedAt: DomainDate | null;
  completedAt: DomainDate | null;
  updatedAt: DomainDate;
}

export interface SyncSessionPersistenceDTO {
  id: string;
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
  createdAt: PersistenceDate;
  startedAt: PersistenceDate | null;
  completedAt: PersistenceDate | null;
  updatedAt: PersistenceDate;
}

// ============ 领域事件 ============

export interface SyncSessionCreatedDomainEvent {
  type: 'sync.session.created';
  aggregateId: SyncSessionId;
  timestamp: DomainDate;
  payload: { session: SyncSessionServerDTO };
}

export interface SyncSessionCompletedDomainEvent {
  type: 'sync.session.completed';
  aggregateId: SyncSessionId;
  timestamp: DomainDate;
  payload: { statistics: SyncSessionStatsDTO; newVersion: SyncVersionServerDTO };
}

export interface SyncSessionFailedDomainEvent {
  type: 'sync.session.failed';
  aggregateId: SyncSessionId;
  timestamp: DomainDate;
  payload: { error: { code: string; message: string } };
}

// ============ 接口定义 ============

export interface SyncSessionServer {
  id: SyncSessionId;
  profileId: SyncProfileId;
  status: SyncSessionStatus;
  direction: SyncDirection;
  strategy: SyncStrategy;
  triggerType: SyncTriggerType;
  triggerDevice: DeviceInfoDTO;
  startVersion: SyncVersionServerDTO;
  endVersion: SyncVersionServerDTO | null;
  conflicts: SyncConflictServerDTO[] | null;
  statistics: SyncSessionStatsDTO | null;
  error: { code: string; message: string; details?: unknown } | null;
  canRetry: boolean;
  retryCount: number;
  createdAt: DomainDate;
  startedAt: DomainDate | null;
  completedAt: DomainDate | null;
  updatedAt: DomainDate;

}
