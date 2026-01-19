/**
 * Resource Repository Interface
 * Resource 仓储接口
 */
import { Resource } from '@dailyuse/domain-server/repository';

export interface IResourceRepository {
  findById(uuid: string): Promise<Resource | null>;
  findByRepositoryUuid(repositoryUuid: string): Promise<Resource[]>;
  findByFolderUuid(folderUuid: string): Promise<Resource[]>;
  save(resource: Resource): Promise<void>;
  delete(uuid: string): Promise<void>;
  existsByPath(repositoryUuid: string, path: string): Promise<boolean>;
}
