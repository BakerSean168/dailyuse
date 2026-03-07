import { Folder, type FolderState } from '../../../../domain-server/entities/folder';
import { ResourceId } from '../../../../domain-shared/value-objects/resource-id';
import { FolderMetadata } from '../../../../domain-shared/value-objects/folder-metadata';

export class FolderSqliteMapper {
  static toDomain(row: any): Folder {
    const metadata = row.metadata ?? JSON.stringify(FolderMetadata.createDefault().toDTO());

    const state: FolderState = {
      id: ResourceId.of(row.id),
      repositoryId: row.repository_id,
      identityId: row.identity_id,
      parentId: row.parent_id,
      name: row.name,
      path: row.path,
      order: row.order ?? 0,
      isExpanded: row.is_expanded ?? false,
      metadata: FolderMetadata.fromDTO(JSON.parse(metadata)),
      createdAt: row.created_at instanceof Date ? row.created_at : new Date(row.created_at),
      updatedAt: row.updated_at instanceof Date ? row.updated_at : new Date(row.updated_at),
      children: null,
    };

    return Folder.load(state);
  }
}
