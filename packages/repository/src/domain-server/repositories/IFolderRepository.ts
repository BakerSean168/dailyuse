import type { Folder } from '../entities/folder';

export interface IFolderRepository {
  save(folder: Folder): Promise<void>;
  findById(id: string): Promise<Folder | null>;
  findByRepositoryId(repositoryId: string): Promise<Folder[]>;
  findByParentId(parentId: string): Promise<Folder[]>;
  findRootFolders(repositoryId: string): Promise<Folder[]>;
  delete(id: string): Promise<void>;
  deleteByRepositoryId(repositoryId: string): Promise<void>;
  exists(id: string): Promise<boolean>;
}
