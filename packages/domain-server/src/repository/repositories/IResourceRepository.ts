/**
 * IResourceRepository - 资源仓储接口
 * 
 * 职责：
 * - 资源的 CRUD 操作
 * - 资源查询
 */

import type { Resource } from '../entities/resource';

export interface IResourceRepository {
  /**
   * 保存资源
   */
  save(resource: Resource): Promise<void>;

  /**
   * 根据 UUID 查找资源
   */
  findByUuid(uuid: string): Promise<Resource | null>;

  /**
   * 根据 ID 查找资源 (别名为 findByUuid)
   */
  findById(uuid: string): Promise<Resource | null>;

  /**
   * 根据仓库 UUID 查找资源
   */
  findByRepositoryUuid(repositoryUuid: string): Promise<Resource[]>;

  /**
   * 根据文件夹 UUID 查找资源
   */
  findByFolderUuid(folderUuid: string): Promise<Resource[]>;

  /**
   * 根据账户 UUID 查找资源
   */
  findByAccountUuid(accountUuid: string): Promise<Resource[]>;

  /**
   * 检查路径是否已存在资源
   */
  existsByPath(repositoryUuid: string, path: string): Promise<boolean>;

  /**
   * 删除资源
   */
  delete(uuid: string): Promise<void>;
}
