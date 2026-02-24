/**
 * Repository Prisma Repository
 *
 * Prisma implementation of IRepositoryRepository.
 * Supports both PostgreSQL (API) and SQLite (Desktop).
 */

import type { PrismaClient } from '@dailyuse/database';
import { Prisma } from '@dailyuse/database';
import type { IRepositoryRepository } from '../../../domain-server/repositories/IRepositoryRepository';
import { Repository, type RepositoryState } from '../../../domain-server/aggregates/repository';
import type { RepositoryStatus } from '@dailyuse/contracts/repository';
import type {
  RepositoryConfigDTO,
  RepositoryStatsDTO,
  RepositoryType,
} from '@dailyuse/contracts/repository';
import { RepositoryConfig } from '../../../domain-shared/value-objects/repository-config';
import { RepositoryId } from '../../../domain-shared/value-objects/repository-id';
import { RepositoryStats } from '../../../domain-shared/value-objects/repository-stats';
import { IdentityId } from '@dailyuse/domain-shared/shared';

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

function mapToDomain(data: {
  id: string;
  identityId: string;
  name: string;
  type: string;
  path: string;
  description: string | null;
  config: unknown;
  stats: unknown;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  version: number;
  deletedAt: Date | null;
}): Repository {
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

/**
 * Repository Prisma Repository
 *
 * Skeleton implementation - to be completed when extracting from apps/api.
 */
export class RepositoryPrismaRepository implements IRepositoryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(repository: Repository): Promise<void> {
    const dto = repository.toServerDTO();
    await this.prisma.repository.upsert({
      where: { id: dto.id },
      create: {
        id: dto.id,
        identityId: dto.identityId,
        name: dto.name,
        type: dto.type,
        path: dto.path ?? '',
        description: dto.description ?? null,
        config: JSON.parse(JSON.stringify(dto.config)) as Prisma.InputJsonValue,
        stats: JSON.parse(JSON.stringify(dto.stats)) as Prisma.InputJsonValue,
        status: dto.status,
        version: dto.version,
        createdAt: new Date(dto.createdAt),
        updatedAt: new Date(dto.updatedAt),
        deletedAt: dto.deletedAt ? new Date(dto.deletedAt) : null,
      },
      update: {
        identityId: dto.identityId,
        name: dto.name,
        type: dto.type,
        path: dto.path ?? '',
        description: dto.description ?? null,
        config: JSON.parse(JSON.stringify(dto.config)) as Prisma.InputJsonValue,
        stats: JSON.parse(JSON.stringify(dto.stats)) as Prisma.InputJsonValue,
        status: dto.status,
        version: dto.version,
        updatedAt: new Date(dto.updatedAt),
        deletedAt: dto.deletedAt ? new Date(dto.deletedAt) : null,
      },
    });
  }

  async findById(id: string): Promise<Repository | null> {
    const data = await this.prisma.repository.findUnique({ where: { id } });
    return data ? mapToDomain(data) : null;
  }

  async findByIdentityId(identityId: string): Promise<Repository[]> {
    const rows = await this.prisma.repository.findMany({
      where: { identityId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(mapToDomain);
  }

  async findByIdentityIdAndStatus(identityId: string, status: RepositoryStatus): Promise<Repository[]> {
    const rows = await this.prisma.repository.findMany({
      where: { identityId, status },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(mapToDomain);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.repository.delete({ where: { id } });
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.repository.count({ where: { id } });
    return count > 0;
  }
}
