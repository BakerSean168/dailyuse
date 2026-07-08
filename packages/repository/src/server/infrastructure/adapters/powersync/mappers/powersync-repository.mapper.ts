import type { RepositoryStatus } from '@dailyuse/contracts/repository';
import { IdentityId } from '@dailyuse/domain-shared/shared';
import { Repository, type RepositoryState } from '../../../../domain/aggregates/repository';
import { RepositoryConfig } from '../../../../domain/value-objects/repository-config';
import { RepositoryId } from '../../../../domain/value-objects/repository-id';
import { RepositoryStats } from '../../../../domain/value-objects/repository-stats';

function normalizeRepositoryStatus(status: string): RepositoryStatus {
  if (status === 'ACTIVE') return 'Active';
  if (status === 'ARCHIVED') return 'Archived';
  if (status === 'DELETED') return 'Deleted';
  return status as RepositoryStatus;
}

export interface PowerSyncRepositoryRow {
  id: string;
  identity_id: string;
  name: string;
  description: string | null;
  type: string;
  path: string | null;
  status: string;
  config: string | null;
  stats: string | null;
  version: number | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface PowerSyncRepositoryWriteRow {
  id: string;
  identity_id: string;
  name: string;
  description: string | null;
  type: string;
  path: string | null;
  status: string;
  config: string;
  stats: string;
  version: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

function toDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export class PowerSyncRepositoryMapper {
  static toDomain(row: PowerSyncRepositoryRow): Repository {
    const config = row.config ?? JSON.stringify(RepositoryConfig.createDefault().toDTO());
    const stats = row.stats ?? JSON.stringify(RepositoryStats.createEmpty().toDTO());
    const createdAt = toDate(row.created_at) ?? new Date();
    const updatedAt = toDate(row.updated_at) ?? createdAt;

    const state: RepositoryState = {
      id: RepositoryId.of(row.id),
      identityId: IdentityId.of(row.identity_id),
      name: row.name,
      description: row.description,
      type: row.type as RepositoryState['type'],
      path: row.path ?? null,
      status: normalizeRepositoryStatus(row.status),
      config: RepositoryConfig.fromDTO(JSON.parse(config)),
      stats: RepositoryStats.fromDTO(JSON.parse(stats)),
      createdAt,
      updatedAt,
      version: row.version ?? 1,
      deletedAt: toDate(row.deleted_at),
    };

    return Repository.load(state);
  }

  static toPersistence(repository: Repository): PowerSyncRepositoryWriteRow {
    const dto = repository.toServerDTO();
    return {
      id: String(dto.id),
      identity_id: String(dto.identityId),
      name: dto.name,
      description: dto.description ?? null,
      type: dto.type,
      path: dto.path ?? null,
      status: dto.status,
      config: JSON.stringify(dto.config),
      stats: JSON.stringify(dto.stats),
      version: dto.version,
      created_at: new Date(dto.createdAt).toISOString(),
      updated_at: new Date(dto.updatedAt).toISOString(),
      deleted_at: dto.deletedAt ? new Date(dto.deletedAt).toISOString() : null,
    };
  }
}
