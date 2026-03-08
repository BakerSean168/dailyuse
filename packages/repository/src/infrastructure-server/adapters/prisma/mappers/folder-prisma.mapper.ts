import type { Folder as PrismaFolder } from '@dailyuse/database';
import type { FolderMetadataDTO } from '@dailyuse/contracts/repository';
import { Folder, type FolderState } from '../../../../domain-server/entities/folder';
import { ResourceId } from '../../../../domain-shared/value-objects/resource-id';
import { FolderMetadata } from '../../../../domain-shared/value-objects/folder-metadata';

function parseMetadata(value: unknown): FolderMetadata {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return FolderMetadata.createDefault();
  }
  return FolderMetadata.fromDTO(value as FolderMetadataDTO);
}

export class FolderPrismaMapper {
  static toDomain(data: PrismaFolder): Folder {
    const state: FolderState = {
      id: ResourceId.of(data.id),
      repositoryId: data.repositoryId,
      identityId: data.identityId,
      parentId: data.parentId,
      name: data.name,
      path: data.path,
      order: data.order,
      isExpanded: data.isExpanded,
      metadata: parseMetadata(data.metadata),
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      children: null,
    };
    return Folder.load(state);
  }

  static toDomainList(rows: PrismaFolder[]): Folder[] {
    return rows.map((row) => FolderPrismaMapper.toDomain(row));
  }
}
