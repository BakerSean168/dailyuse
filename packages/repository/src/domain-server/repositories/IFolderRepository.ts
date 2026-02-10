import type { Folder } from '../entities/folder';

export interface IFolderRepository {
  save(folder: Folder): Promise<void>;
  findByUuid(uuid: string): Promise<Folder | null>;
  findByRepositoryUuid(repositoryUuid: string): Promise<Folder[]>;
  findByParentUuid(parentUuid: string): Promise<Folder[]>;
  findRootFolders(repositoryUuid: string): Promise<Folder[]>;
  delete(uuid: string): Promise<void>;
  deleteByRepositoryUuid(repositoryUuid: string): Promise<void>;
  exists(uuid: string): Promise<boolean>;
}
