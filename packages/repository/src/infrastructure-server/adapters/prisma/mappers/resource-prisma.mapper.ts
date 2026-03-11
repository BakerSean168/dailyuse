import type { Resource as PrismaResource } from '@dailyuse/database';
import type {
  ExternalLink,
  ResourceMetadataDTO,
  ResourceStatsDTO,
  ResourceStatus,
  ResourceType,
} from '@dailyuse/contracts/repository';
import type { FolderId } from '@dailyuse/contracts/primitives';
import { Resource, type ResourceState } from '../../../../domain-server/entities/resource';
import { ResourceId } from '../../../../domain-shared/value-objects/resource-id';
import { RepositoryId } from '../../../../domain-shared/value-objects/repository-id';
import { ResourceMetadata } from '../../../../domain-shared/value-objects/resource-metadata';
import { ResourceStats } from '../../../../domain-shared/value-objects/resource-stats';

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

export class ResourcePrismaMapper {
  static toDomain(data: PrismaResource): Resource {
    const metadata = parseMetadata(data.metadata);
    const state: ResourceState = {
      id: ResourceId.of(data.id),
      repositoryId: RepositoryId.of(data.repositoryId),
      identityId: data.identityId ?? '',
      folderId: data.folderId as FolderId | null,
      type: data.type as ResourceType,
      name: data.name,
      path: data.path,
      mimeType:
        typeof metadata.toDTO().mimeType === 'string'
          ? (metadata.toDTO().mimeType as string)
          : null,
      size: data.size,
      content: data.content,
      childrenCount: null,
      metadata,
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

  static toDomainList(rows: PrismaResource[]): Resource[] {
    return rows.map((row) => ResourcePrismaMapper.toDomain(row));
  }
}
