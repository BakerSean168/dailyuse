/**
 * Resource Prisma Repository
 *
 * Prisma implementation of IResourceRepository.
 * Supports both PostgreSQL (API) and SQLite (Desktop).
 */

import type { PrismaClient } from '@dailyuse/database';
import { Prisma } from '@dailyuse/database';
import type { IResourceRepository } from '../../../domain-server/repositories/IResourceRepository';
import { Resource, type ResourceState } from '../../../domain-server/entities/resource';
import { ResourceId } from '../../../domain-shared/value-objects/resource-id';
import { RepositoryId } from '../../../domain-shared/value-objects/repository-id';
import type { FolderId } from '@dailyuse/contracts/primitives';
import { ResourceMetadata } from '../../../domain-shared/value-objects/resource-metadata';
import { ResourceStats } from '../../../domain-shared/value-objects/resource-stats';
import type {
  ResourceMetadataDTO,
  ResourceStatus,
  ResourceStatsDTO,
  ResourceType,
  ExternalLink,
} from '@dailyuse/contracts/repository';

function normalizeResourceStatus(status: string): ResourceStatus {
  if (status === 'ACTIVE') return 'Active';
  if (status === 'ARCHIVED') return 'Archived';
  if (status === 'DELETED') return 'Deleted';
  if (status === 'DRAFT') return 'Draft';
  return status as ResourceStatus;
}

function parseMetadata(value: unknown): ResourceMetadata {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return ResourceMetadata.createEmpty();
  }
  return ResourceMetadata.fromDTO(value as ResourceMetadataDTO);
}

function parseStats(value: unknown): ResourceStats {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return ResourceStats.createEmpty();
  }
  return ResourceStats.fromDTO(value as ResourceStatsDTO);
}

function mapToDomain(data: {
  id: string;
  repositoryId: string;
  folderId: string | null;
  type: string;
  name: string;
  path: string;
  size: number;
  content: string | null;
  metadata: unknown;
  stats: unknown;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}): Resource {
  const state: ResourceState = {
    id: ResourceId.of(data.id),
    repositoryId: RepositoryId.of(data.repositoryId),
    folderId: data.folderId as FolderId | null,
    type: data.type as ResourceType,
    name: data.name,
    path: data.path,
    mimeType: null,
    size: data.size,
    content: data.content,
    childrenCount: null,
    metadata: parseMetadata(data.metadata),
    stats: parseStats(data.stats),
    status: normalizeResourceStatus(data.status),
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    version: 1,
    deletedAt: data.deletedAt,
    externalLinks: null as ExternalLink[] | null,
  };

  return Resource.load(state);
}

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
    return data ? mapToDomain(data) : null;
  }

  async findByRepositoryId(repositoryId: string): Promise<Resource[]> {
    const rows = await this.prisma.resource.findMany({
      where: { repositoryId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(mapToDomain);
  }

  async findByFolderId(folderId: string): Promise<Resource[]> {
    const rows = await this.prisma.resource.findMany({
      where: { folderId },
      orderBy: { name: 'asc' },
    });
    return rows.map(mapToDomain);
  }

  async findByIdentityId(identityId: string): Promise<Resource[]> {
    const rows = await this.prisma.resource.findMany({
      where: { repository: { identityId } },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(mapToDomain);
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
