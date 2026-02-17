import type { FolderMetadataDTO } from '../value-objects/folder-metadata';

export interface FolderClientDTO {
  id: string;
  repositoryId: string;
  parentId: string | null;
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
