/**
 * Data Snapshot Entity - Server Interface
 * 数据快照实体
 */

import type { DataSnapshotId, SyncSessionId, DomainDate, PersistenceDate, TransferDate } from '@/primitives';
import type { SyncableEntityType } from '../value-objects/syncable-entity-type';
import type { SyncVersionServerDTO } from '../value-objects';
import type { DataSnapshotClientDTO } from './data-snapshot-client';

// ============ DTO 定义 ============

export interface DataSnapshotServerDTO {
  id: string;
  sessionId: string;
  snapshotType: 'full' | 'incremental';
  source: 'local' | 'remote';
  version: SyncVersionServerDTO;
  checksum: string;
  entityTypes: SyncableEntityType[];
  entityCounts: Record<string, number>;
  compressedSize: number;
  rawSize: number;
  createdAt: TransferDate;
  data: Record<string, unknown[]> | null;
}

export interface DataSnapshotPersistenceDTO {
  id: string;
  sessionId: string;
  snapshotType: string;
  source: string;
  versionJson: string;
  checksum: string;
  entityTypesJson: string;
  entityCountsJson: string;
  compressedSize: number;
  rawSize: number;
  createdAt: PersistenceDate;
  dataPath: string | null;
  dataJson: string | null;
}

// ============ 接口定义 ============

export interface DataSnapshotServer {
  id: DataSnapshotId;
  sessionId: SyncSessionId;
  snapshotType: 'full' | 'incremental';
  source: 'local' | 'remote';
  version: SyncVersionServerDTO;
  checksum: string;
  entityTypes: SyncableEntityType[];
  entityCounts: Record<string, number>;
  compressedSize: number;
  rawSize: number;
  createdAt: DomainDate;
  data: Record<string, unknown[]> | null;

  loadData(): Promise<void>;
  getEntityData<T>(entityType: SyncableEntityType): T[] | null;
}
}
