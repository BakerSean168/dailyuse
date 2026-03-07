/**
 * Repository Prisma Repository
 *
 * Prisma implementation of IRepositoryRepository.
 * Supports both PostgreSQL (API) and SQLite (Desktop).
 */

import type { PrismaClient, Prisma } from '@dailyuse/database';
import type { IRepositoryRepository } from '../../../domain-server/repositories/IRepositoryRepository';
import { Repository } from '../../../domain-server/aggregates/repository';
import type { RepositoryStatus } from '@dailyuse/contracts/repository';
import { RepositoryPrismaMapper } from './mappers/repository-prisma.mapper';

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
    return data ? RepositoryPrismaMapper.toDomain(data) : null;
  }

  async findByIdentityId(identityId: string): Promise<Repository[]> {
    const rows = await this.prisma.repository.findMany({
      where: { identityId },
      orderBy: { createdAt: 'desc' },
    });
    return RepositoryPrismaMapper.toDomainList(rows);
  }

  async findByIdentityIdAndStatus(
    identityId: string,
    status: RepositoryStatus,
  ): Promise<Repository[]> {
    const rows = await this.prisma.repository.findMany({
      where: { identityId, status },
      orderBy: { createdAt: 'desc' },
    });
    return RepositoryPrismaMapper.toDomainList(rows);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.repository.delete({ where: { id } });
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.repository.count({ where: { id } });
    return count > 0;
  }
}
