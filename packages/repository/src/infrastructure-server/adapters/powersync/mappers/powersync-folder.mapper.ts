import { Folder, type FolderState } from '../../../../domain-server/entities/folder';
import { ResourceId } from '../../../../domain-shared/value-objects/resource-id';
import { FolderMetadata } from '../../../../domain-shared/value-objects/folder-metadata';

export interface PowerSyncFolderRow {
  id: string;
  repository_id: string;
  identity_id: string | null;
  parent_id: string | null;
  name: string;
  path: string;
  order: number | null;
  is_expanded: number | null;
  metadata: string | null;
  created_at: string;
  updated_at: string;
}

export interface PowerSyncFolderWriteRow {
  id: string;
  repository_id: string;
  identity_id: string | null;
  parent_id: string | null;
  name: string;
  path: string;
  order: number;
  is_expanded: number;
  metadata: string;
  created_at: string;
  updated_at: string;
}

function toDate(value: string | null | undefined): Date {
  if (!value) return new Date();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

export class PowerSyncFolderMapper {
  static toDomain(row: PowerSyncFolderRow): Folder {
    const metadata = row.metadata ?? JSON.stringify(FolderMetadata.createDefault().toDTO());

    const state: FolderState = {
      id: ResourceId.of(row.id),
      repositoryId: row.repository_id,
      identityId: row.identity_id ?? '',
      parentId: row.parent_id,
      name: row.name,
      path: row.path,
      order: row.order ?? 0,
      isExpanded: (row.is_expanded ?? 0) === 1,
      metadata: FolderMetadata.fromDTO(JSON.parse(metadata)),
      createdAt: toDate(row.created_at),
      updatedAt: toDate(row.updated_at),
      children: null,
    };

    return Folder.load(state);
  }

  static toPersistence(folder: Folder): PowerSyncFolderWriteRow {
    const dto = folder.toServerDTO();
    return {
      id: dto.id,
      repository_id: dto.repositoryId,
      identity_id: dto.identityId || null,
      parent_id: dto.parentId,
      name: dto.name,
      path: dto.path,
      order: dto.order,
      is_expanded: dto.isExpanded ? 1 : 0,
      metadata: JSON.stringify(dto.metadata),
      created_at: new Date(dto.createdAt).toISOString(),
      updated_at: new Date(dto.updatedAt).toISOString(),
    };
  }
}
