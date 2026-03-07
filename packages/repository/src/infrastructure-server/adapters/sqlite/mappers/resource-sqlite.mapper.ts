import type { FolderId } from '@dailyuse/contracts/primitives';
import { Resource, type ResourceState } from '../../../../domain-server/entities/resource';
import { ResourceId } from '../../../../domain-shared/value-objects/resource-id';
import { RepositoryId } from '../../../../domain-shared/value-objects/repository-id';
import { ResourceMetadata } from '../../../../domain-shared/value-objects/resource-metadata';
import { ResourceStats } from '../../../../domain-shared/value-objects/resource-stats';

export class ResourceSqliteMapper {
  static toDomain(row: any): Resource {
    const metadata = row.metadata ?? JSON.stringify(ResourceMetadata.createEmpty().toDTO());
    const stats = row.stats ?? JSON.stringify(ResourceStats.createEmpty().toDTO());

    const state: ResourceState = {
      id: ResourceId.of(row.id),
      repositoryId: RepositoryId.of(row.repository_id),
      identityId: row.identity_id || '',
      folderId: row.folder_id ? (row.folder_id as FolderId) : null,
      type: row.type,
      name: row.name,
      path: row.path,
      mimeType: row.mime_type ?? null,
      size: row.size,
      content: row.content,
      childrenCount: null,
      metadata: ResourceMetadata.fromDTO(JSON.parse(metadata)),
      stats: ResourceStats.fromDTO(JSON.parse(stats)),
      status: row.status,
      createdAt: row.created_at instanceof Date ? row.created_at : new Date(row.created_at),
      updatedAt: row.updated_at instanceof Date ? row.updated_at : new Date(row.updated_at),
      version: row.version ?? 1,
      deletedAt: row.deleted_at
        ? row.deleted_at instanceof Date
          ? row.deleted_at
          : new Date(row.deleted_at)
        : null,
      externalLinks: null,
    };

    return Resource.load(state);
  }
}
