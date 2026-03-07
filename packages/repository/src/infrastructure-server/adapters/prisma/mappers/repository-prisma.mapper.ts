import type { Repository as PrismaRepository } from '@dailyuse/database';
import type {
  RepositoryConfigDTO,
  RepositoryStatsDTO,
  RepositoryStatus,
  RepositoryType,
} from '@dailyuse/contracts/repository';
import { IdentityId } from '@dailyuse/domain-shared/shared';
import { Repository, type RepositoryState } from '../../../../domain-server/aggregates/repository';
import { RepositoryConfig } from '../../../../domain-shared/value-objects/repository-config';
import { RepositoryId } from '../../../../domain-shared/value-objects/repository-id';
import { RepositoryStats } from '../../../../domain-shared/value-objects/repository-stats';

function normalizeRepositoryStatus(status: string): RepositoryStatus {
  if (status === 'ACTIVE') return 'Active';
  if (status === 'ARCHIVED') return 'Archived';
  if (status === 'DELETED') return 'Deleted';
  return status as RepositoryStatus;
}

function parseConfig(value: unknown): RepositoryConfig {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return RepositoryConfig.createDefault();
  }
  return RepositoryConfig.fromDTO(value as RepositoryConfigDTO);
}

function parseStats(value: unknown): RepositoryStats {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return RepositoryStats.createEmpty();
  }
  return RepositoryStats.fromDTO(value as RepositoryStatsDTO);
}

export class RepositoryPrismaMapper {
  static toDomain(data: PrismaRepository): Repository {
    const state: RepositoryState = {
      id: RepositoryId.of(data.id),
      identityId: IdentityId.of(data.identityId),
      name: data.name,
      type: data.type as RepositoryType,
      path: data.path || null,
      description: data.description,
      config: parseConfig(data.config),
      stats: parseStats(data.stats),
      status: normalizeRepositoryStatus(data.status),
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      version: data.version ?? 1,
      deletedAt: data.deletedAt,
    };
    return Repository.load(state);
  }

  static toDomainList(rows: PrismaRepository[]): Repository[] {
    return rows.map((row) => RepositoryPrismaMapper.toDomain(row));
  }
}
