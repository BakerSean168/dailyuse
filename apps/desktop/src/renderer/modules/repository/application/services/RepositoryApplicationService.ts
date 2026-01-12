/**
 * Repository Application Service - Renderer
 *
 * 仓库模块应用服务层
 * 封装 @dailyuse/application-client 的 Repository Use Cases
 */

import {
  ListRepositories,
  GetRepository,
  GetFileTree,
  SearchResources,
  CreateFolder,
  GetFolderContents,
  DeleteFolder,
  GetResource,
  DeleteResource,
} from '@dailyuse/application-client';
import {
  RepositoryContainer,
  type CreateRepositoryRequest,
  type CreateFolderRequest,
} from '@dailyuse/infrastructure-client';
import type {
  RepositoryClientDTO,
  FolderClientDTO,
  ResourceClientDTO,
  SearchRequest,
  SearchResponse,
} from '@dailyuse/contracts/repository';

/**
 * 仓库应用服务
 *
 * 提供仓库相关的所有业务操作
 * 返回类型与 @dailyuse/application-client 保持一致
 */
export class RepositoryApplicationService {
  private getApiClient() {
    return RepositoryContainer.getInstance().getApiClient();
  }

  // ===== Repository Operations =====

  /**
   * 获取仓库列表
   */
  listRepositories() {
    return ListRepositories.getInstance().execute();
  }

  /**
   * 获取单个仓库
   */
  getRepository(repositoryUuid: string) {
    return GetRepository.getInstance().execute(repositoryUuid);
  }

  /**
   * 创建仓库
   */
  createRepository(request: CreateRepositoryRequest): Promise<RepositoryClientDTO> {
    return this.getApiClient().createRepository(request);
  }

  /**
   * 删除仓库
   */
  deleteRepository(uuid: string): Promise<void> {
    return this.getApiClient().deleteRepository(uuid);
  }

  /**
   * 获取文件树
   */
  getFileTree(repositoryUuid: string) {
    return GetFileTree.getInstance().execute(repositoryUuid);
  }

  /**
   * 搜索资源
   */
  searchResources(input: SearchRequest) {
    return SearchResources.getInstance().execute(input);
  }

  /**
   * 搜索（支持 SearchRequest 格式）
   */
  search(request: SearchRequest): Promise<SearchResponse> {
    return this.getApiClient().search(request);
  }

  // ===== Folder Operations =====

  /**
   * 创建文件夹
   */
  createFolder(input: CreateFolderRequest) {
    return CreateFolder.getInstance().execute(input);
  }

  /**
   * 获取文件夹内容
   */
  getFolderContents(folderUuid: string) {
    return GetFolderContents.getInstance().execute(folderUuid);
  }

  /**
   * 重命名文件夹
   */
  renameFolder(uuid: string, name: string): Promise<FolderClientDTO> {
    return this.getApiClient().renameFolder(uuid, name);
  }

  /**
   * 移动文件夹
   */
  moveFolder(uuid: string, targetParentUuid: string): Promise<FolderClientDTO> {
    return this.getApiClient().moveFolder(uuid, targetParentUuid);
  }

  /**
   * 删除文件夹
   */
  deleteFolder(folderUuid: string) {
    return DeleteFolder.getInstance().execute(folderUuid);
  }

  // ===== Resource Operations =====

  /**
   * 获取资源
   */
  getResource(resourceUuid: string) {
    return GetResource.getInstance().execute(resourceUuid);
  }

  /**
   * 重命名资源
   */
  renameResource(uuid: string, name: string): Promise<ResourceClientDTO> {
    return this.getApiClient().renameResource(uuid, name);
  }

  /**
   * 移动资源
   */
  moveResource(uuid: string, targetFolderUuid: string): Promise<ResourceClientDTO> {
    return this.getApiClient().moveResource(uuid, targetFolderUuid);
  }

  /**
   * 删除资源
   */
  deleteResource(resourceUuid: string) {
    return DeleteResource.getInstance().execute(resourceUuid);
  }
}

/**
 * 仓库应用服务单例
 */
export const repositoryApplicationService = new RepositoryApplicationService();
