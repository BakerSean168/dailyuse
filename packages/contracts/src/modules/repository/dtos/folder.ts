import type { FolderMetadataDTO } from '../value-objects/folder-metadata';
import type { FolderId, RepositoryId } from '../../../primitives';

export interface FolderClientDTO {
  id: FolderId;
  repositoryId: RepositoryId;
  parentId: FolderId | null;
  name: string;
  path: string;
  order: number;
  isExpanded: boolean;
  metadata: FolderMetadataDTO;
  createdAt: number;
  updatedAt: number;
  children?: FolderClientDTO[] | null;
  depth: number;
  isRoot: boolean;
  hasChildren: boolean;
  pathParts: string[];
  displayName: string;
  createdAtText: string;
  updatedAtText: string;
}
