/**
 * Data Snapshot Entity - Client Interface
 * 数据快照实体（客户端�?
 */

import type { DataSnapshotId, SyncSessionId, TransferDate } from '@/primitives';
import type { SyncableEntityType } from '../value-objects/syncable-entity-type';
import type { SyncVersionClientDTO } from '../value-objects';

// ============ DTO 定义 ============

export interface DataSnapshotClientDTO {
  id: string;
  sessionId: string;
  snapshotType: 'full' | 'incremental';
  source: 'local' | 'remote';
  version: SyncVersionClientDTO;
  checksum: string;
  entityTypes: SyncableEntityType[];
  entityCounts: Record<string, number>;
  compressedSize: number;
  rawSize: number;
  createdAt: TransferDate;
  isDataLoaded: boolean;
}

// ============ 接口定义 ============

export interface DataSnapshotClient {
  id: DataSnapshotId;
  sessionId: SyncSessionId;
  snapshotType: 'full' | 'incremental';
  source: 'local' | 'remote';
  entityTypes: SyncableEntityType[];
  entityCounts: Record<string, number>;
  isDataLoaded: boolean;
}
