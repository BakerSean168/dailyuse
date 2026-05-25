/**
 * Resource Prisma Repository
 *
 * Prisma implementation of IResourceRepository.
 * Supports both PostgreSQL (API) and SQLite (Desktop).
 */

import type { PrismaClient, Prisma } from '@dailyuse/database';
import type { IResourceRepository } from '../../../domain-server/repositories/i-resource-repository';
import { Resource } from '../../../domain-server/entities/resource';
import { ResourcePrismaMapper } from './mappers/resource-prisma.mapper';

/**
 * Resource Prisma Repository
 *
 * Skeleton implementation - to be completed when extracting from apps/api.
 */
export class ResourcePrismaRepository implements IResourceRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(resource: Resource): Promise<void> {
    const dto = resource.toServerDTO();

    await this.prisma.resource.upsert({
      where: { id: dto.id },
      create: {
        id: dto.id,
        repositoryId: dto.repositoryId,
        identityId: dto.identityId,
        folderId: dto.folderId,
        name: dto.name,
        type: dto.type,
        path: dto.path,
        size: dto.size ?? 0,
        content: dto.content,
        metadata: JSON.parse(JSON.stringify(dto.metadata)) as Prisma.InputJsonValue,
        stats: JSON.parse(JSON.stringify(dto.stats)) as Prisma.InputJsonValue,
        status: dto.status,
        createdAt: new Date(dto.createdAt),
        updatedAt: new Date(dto.updatedAt),
        modifiedAt: dto.updatedAt ? new Date(dto.updatedAt) : null,
        deletedAt: dto.deletedAt ? new Date(dto.deletedAt) : null,
      },
      update: {
        repositoryId: dto.repositoryId,
        folderId: dto.folderId,
        name: dto.name,
        type: dto.type,
        path: dto.path,
        size: dto.size ?? 0,
        content: dto.content,
        metadata: JSON.parse(JSON.stringify(dto.metadata)) as Prisma.InputJsonValue,
        stats: JSON.parse(JSON.stringify(dto.stats)) as Prisma.InputJsonValue,
        status: dto.status,
        updatedAt: new Date(dto.updatedAt),
        modifiedAt: dto.updatedAt ? new Date(dto.updatedAt) : null,
        deletedAt: dto.deletedAt ? new Date(dto.deletedAt) : null,
      },
    });
  }

  async findById(id: string): Promise<Resource | null> {
    const data = await this.prisma.resource.findUnique({ where: { id } });
    return data ? ResourcePrismaMapper.toDomain(data) : null;
  }

  async findByRepositoryId(repositoryId: string): Promise<Resource[]> {
    const rows = await this.prisma.resource.findMany({
      where: { repositoryId },
      orderBy: { createdAt: 'desc' },
    });
    return ResourcePrismaMapper.toDomainList(rows);
  }

  async findByRepositoryIdAndPath(repositoryId: string, path: string): Promise<Resource | null> {
    const row = await this.prisma.resource.findFirst({
      where: { repositoryId, path },
    });
    return row ? ResourcePrismaMapper.toDomain(row) : null;
  }

  async findByFolderId(folderId: string): Promise<Resource[]> {
    const rows = await this.prisma.resource.findMany({
      where: { folderId },
      orderBy: { name: 'asc' },
    });
    return ResourcePrismaMapper.toDomainList(rows);
  }

  async findByIdentityId(identityId: string): Promise<Resource[]> {
    const rows = await this.prisma.resource.findMany({
      where: { repository: { identityId } },
      orderBy: { createdAt: 'desc' },
    });
    return ResourcePrismaMapper.toDomainList(rows);
  }

  async existsByPath(repositoryId: string, path: string): Promise<boolean> {
    const count = await this.prisma.resource.count({
      where: { repositoryId, path },
    });
    return count > 0;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.resource.delete({ where: { id } });
  }
}
