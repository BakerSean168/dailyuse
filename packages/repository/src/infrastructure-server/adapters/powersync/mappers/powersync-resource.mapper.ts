import type { FolderId } from '@dailyuse/contracts/primitives';
import { Resource, type ResourceState } from '../../../../domain-server/entities/resource';
import { ResourceId } from '../../../../domain-shared/value-objects/resource-id';
import { RepositoryId } from '../../../../domain-shared/value-objects/repository-id';
import { ResourceMetadata } from '../../../../domain-shared/value-objects/resource-metadata';
import { ResourceStats } from '../../../../domain-shared/value-objects/resource-stats';

function normalizeResourceStatus(status: string): ResourceState['status'] {
  if (status === 'ACTIVE') return 'Active';
  if (status === 'ARCHIVED') return 'Archived';
  if (status === 'DELETED') return 'Deleted';
  if (status === 'DRAFT') return 'Draft';
  return status as ResourceState['status'];
}

export interface PowerSyncResourceRow {
  id: string;
  repository_id: string;
  identity_id: string | null;
  folder_id: string | null;
  type: string;
  name: string;
  path: string;
  size: number | null;
  content: string | null;
  metadata: string | null;
  stats: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  version: number | null;
  deleted_at: string | null;
}

export interface PowerSyncResourceWriteRow {
  id: string;
  repository_id: string;
  identity_id: string;
  folder_id: string | null;
  type: string;
  name: string;
  path: string;
  size: number;
  content: string | null;
  metadata: string;
  stats: string;
  status: string;
  created_at: string;
  updated_at: string;
  version: number;
  deleted_at: string | null;
}

function toDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export class PowerSyncResourceMapper {
  static toDomain(row: PowerSyncResourceRow): Resource {
    const metadata = row.metadata ?? JSON.stringify(ResourceMetadata.createEmpty().toDTO());
    const stats = row.stats ?? JSON.stringify(ResourceStats.createEmpty().toDTO());
    const parsedMetadata = ResourceMetadata.fromDTO(JSON.parse(metadata));
    const metadataDto = parsedMetadata.toDTO();

    const state: ResourceState = {
      id: ResourceId.of(row.id),
      repositoryId: RepositoryId.of(row.repository_id),
      identityId: row.identity_id || '',
      folderId: row.folder_id ? (row.folder_id as FolderId) : null,
      type: row.type as ResourceState['type'],
      name: row.name,
      path: row.path,
      mimeType: typeof metadataDto.mimeType === 'string' ? (metadataDto.mimeType as string) : null,
      size: row.size,
      content: row.content,
      childrenCount: null,
      metadata: parsedMetadata,
      stats: ResourceStats.fromDTO(JSON.parse(stats)),
      status: normalizeResourceStatus(row.status),
      createdAt: toDate(row.created_at) ?? new Date(),
      updatedAt: toDate(row.updated_at) ?? new Date(),
      version: row.version ?? 1,
      deletedAt: toDate(row.deleted_at),
      externalLinks: null,
    };

    return Resource.load(state);
  }

  static toPersistence(resource: Resource): PowerSyncResourceWriteRow {
    const dto = resource.toServerDTO();
    return {
      id: String(dto.id),
      repository_id: String(dto.repositoryId),
      identity_id: dto.identityId || '',
      folder_id: dto.folderId ? String(dto.folderId) : null,
      type: dto.type,
      name: dto.name,
      path: dto.path,
      size: dto.size ?? 0,
      content: dto.content ?? null,
      metadata: JSON.stringify(dto.metadata),
      stats: JSON.stringify(dto.stats),
      status: dto.status,
      created_at: new Date(dto.createdAt).toISOString(),
      updated_at: new Date(dto.updatedAt).toISOString(),
      version: dto.version,
      deleted_at: dto.deletedAt ? new Date(dto.deletedAt).toISOString() : null,
    };
  }
}
