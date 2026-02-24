// @ts-nocheck
import { apiClient } from '@/shared/api/instances';
import type { RepositoryServerDTO, ResourceServerDTO, SearchRequest } from '@dailyuse/contracts/repository';

/**
 * Repository API 客户端
 */
export class RepositoryApiClient {
  private readonly baseUrl = '/repositories';

  // ===== Repository CRUD =====

  /**
   * 创建仓库
   */
  async createRepository(
    request: CreateRepositoryRequestDTO,
  ): Promise<RepositoryDTO> {
    const data = await apiClient.post(this.baseUrl, request);
    return data;
  }

  /**
   * 获取仓库列表
   */
  async getRepositories(params?: {
    page?: number;
    limit?: number;
    type?: string;
    status?: string;
    goalId?: string;
    search?: string;
  }): Promise<RepositoryListResponseDTO> {
    const data = await apiClient.get(this.baseUrl, { params });
    return data;
  }

  /**
   * 获取仓库详情
   */
  async getRepositoryById(id: string): Promise<RepositoryDTO> {
    const data = await apiClient.get(`${this.baseUrl}/${id}`);
    return data;
  }

  /**
   * 更新仓库
   */
  async updateRepository(
    id: string,
    request: UpdateRepositoryRequestDTO,
  ): Promise<RepositoryDTO> {
    const data = await apiClient.put(`${this.baseUrl}/${id}`, request);
    return data;
  }

  /**
   * 删除仓库
   */
  async deleteRepository(id: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${id}`);
  }

  // ===== Repository Status Management =====

  /**
   * 激活仓库
   */
  async activateRepository(id: string): Promise<RepositoryDTO> {
    const data = await apiClient.post(`${this.baseUrl}/${id}/activate`);
    return data;
  }

  /**
   * 归档仓库
   */
  async archiveRepository(id: string): Promise<RepositoryDTO> {
    const data = await apiClient.post(`${this.baseUrl}/${id}/archive`);
    return data;
  }

  /**
   * 暂停仓库
   */
  async pauseRepository(id: string): Promise<RepositoryDTO> {
    const data = await apiClient.post(`${this.baseUrl}/${id}/pause`);
    return data;
  }

  /**
   * 恢复仓库
   */
  async resumeRepository(id: string): Promise<RepositoryDTO> {
    const data = await apiClient.post(`${this.baseUrl}/${id}/resume`);
    return data;
  }

  // ===== Repository Association Management =====

  /**
   * 关联目标到仓库
   */
  async linkGoalToRepository(
    repositoryId: string,
    goalId: string,
  ): Promise<RepositoryDTO> {
    const data = await apiClient.post(`${this.baseUrl}/${repositoryId}/goals/${goalId}`);
    return data;
  }

  /**
   * 取消目标与仓库的关联
   */
  async unlinkGoalFromRepository(
    repositoryId: string,
    goalId: string,
  ): Promise<RepositoryDTO> {
    const data = await apiClient.delete(`${this.baseUrl}/${repositoryId}/goals/${goalId}`);
    return data;
  }

  /**
   * 批量关联目标到仓库
   */
  async batchLinkGoalsToRepository(
    repositoryId: string,
    goalIds: string[],
  ): Promise<RepositoryDTO> {
    const data = await apiClient.post(`${this.baseUrl}/${repositoryId}/goals/batch`, {
      goalIds,
    });
    return data;
  }

  /**
   * 获取仓库关联的目标列表
   */
  async getRepositoryGoals(repositoryId: string): Promise<{ goalIds: string[] }> {
    const data = await apiClient.get(`${this.baseUrl}/${repositoryId}/goals`);
    return data;
  }

  // ===== Repository Resource Management =====

  /**
   * 获取所有资源列表
   */
  async getResources(
    params?: ResourceQueryParamsDTO,
  ): Promise<ResourceListResponseDTO> {
    const data = await apiClient.get(`${this.baseUrl}/resources`, { params });
    return data;
  }

  /**
   * 获取仓库资源列表
   */
  async getRepositoryResources(
    repositoryId: string,
    params?: ResourceQueryParamsDTO,
  ): Promise<ResourceListResponseDTO> {
    const data = await apiClient.get(`${this.baseUrl}/${repositoryId}/resources`, { params });
    return data;
  }

  /**
   * 获取资源详情
   */
  async getResourceById(resourceId: string): Promise<ResourceDTO> {
    const data = await apiClient.get(`${this.baseUrl}/resources/${resourceId}`);
    return data;
  }

  /**
   * 创建资源
   */
  async createResource(
    request: CreateResourceRequestDTO,
  ): Promise<ResourceDTO> {
    const data = await apiClient.post(`${this.baseUrl}/resources`, request);
    return data;
  }

  /**
   * 更新资源
   */
  async updateResource(
    resourceId: string,
    request: UpdateResourceRequestDTO,
  ): Promise<ResourceDTO> {
    const data = await apiClient.put(`${this.baseUrl}/resources/${resourceId}`, request);
    return data;
  }

  /**
   * 删除资源
   */
  async deleteResource(resourceId: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/resources/${resourceId}`);
  }

  /**
   * 批量操作资源
   */
  async batchOperateResources(
    request: BatchOperationRequestDTO,
  ): Promise<BatchOperationResponseDTO> {
    const data = await apiClient.post(`${this.baseUrl}/resources/batch`, request);
    return data;
  }

  // ===== Repository Git Management =====

  /**
   * 获取Git状态
   */
  async getGitStatus(repositoryId: string): Promise<GitStatusResponseDTO> {
    const data = await apiClient.get(`${this.baseUrl}/${repositoryId}/git/status`);
    return data;
  }

  /**
   * 获取Git日志
   */
  async getGitLog(
    repositoryId: string,
    params?: {
      limit?: number;
      offset?: number;
      branch?: string;
    },
  ): Promise<GitLogResponseDTO> {
    const data = await apiClient.get(`${this.baseUrl}/${repositoryId}/git/log`, { params });
    return data;
  }

  /**
   * Git提交
   */
  async gitCommit(
    repositoryId: string,
    request: { message: string; addAll?: boolean },
  ): Promise<GitCommitDTO> {
    const data = await apiClient.post(`${this.baseUrl}/${repositoryId}/git/commit`, request);
    return data;
  }

  /**
   * 创建Git分支
   */
  async createGitBranch(
    repositoryId: string,
    request: { branchName: string; checkout?: boolean },
  ): Promise<{ branchName: string; current: boolean }> {
    const data = await apiClient.post(`${this.baseUrl}/${repositoryId}/git/branch`, request);
    return data;
  }

  /**
   * 切换Git分支
   */
  async switchGitBranch(
    repositoryId: string,
    branchName: string,
  ): Promise<{ branchName: string; current: boolean }> {
    const data = await apiClient.post(`${this.baseUrl}/${repositoryId}/git/checkout`, {
      branchName,
    });
    return data;
  }

  // ===== Repository Sync Management =====

  /**
   * 同步仓库
   */
  async syncRepository(
    repositoryId: string,
    request?: SyncRepositoryRequestDTO,
  ): Promise<RepositoryDTO> {
    const data = await apiClient.post(`${this.baseUrl}/${repositoryId}/sync`, request || {});
    return data;
  }

  /**
   * 获取同步状态
   */
  async getSyncStatus(repositoryId: string): Promise<{ syncStatus: any }> {
    const data = await apiClient.get(`${this.baseUrl}/${repositoryId}/sync-status`);
    return data;
  }

  /**
   * 强制同步
   */
  async forceSyncRepository(repositoryId: string): Promise<RepositoryDTO> {
    const data = await apiClient.post(`${this.baseUrl}/${repositoryId}/force-sync`);
    return data;
  }

  // ===== Search and Query =====

  /**
   * Obsidian 风格搜索
   * Story 11.2
   */
  async search(
    repositoryId: string,
    request: Omit<SearchRequest, 'repositoryId'>,
  ): Promise<any> {
    const data = await apiClient.get(`${this.baseUrl}/${repositoryId}/search`, {
      params: request,
    });
    return data;
  }

  /**
   * 搜索仓库
   */
  async searchRepositories(params: {
    query: string;
    page?: number;
    limit?: number;
    type?: string;
    status?: string;
    tags?: string[];
  }): Promise<RepositoryListResponseDTO> {
    const data = await apiClient.get(`${this.baseUrl}/search`, { params });
    return data;
  }

  /**
   * 搜索内容
   */
  async searchContent(params: {
    query: string;
    repositoryId?: string;
    page?: number;
    limit?: number;
  }): Promise<SearchResultResponseDTO> {
    const data = await apiClient.get(`${this.baseUrl}/search/content`, { params });
    return data;
  }

  /**
   * 获取与指定目标关联的仓库
   */
  async getRepositoriesByGoal(
    goalId: string,
  ): Promise<RepositoryListResponseDTO> {
    const data = await apiClient.get(this.baseUrl, {
      params: { goalId, limit: 1000 },
    });
    return data;
  }

  /**
   * 获取标签云
   */
  async getTagCloud(repositoryId?: string): Promise<TagCloudResponseDTO> {
    const params = repositoryId ? { repositoryId } : {};
    const data = await apiClient.get(`${this.baseUrl}/tags/cloud`, { params });
    return data;
  }

  /**
   * 添加关联内容
   */
  async addLinkedContent(
    request: AddLinkedContentRequestDTO,
  ): Promise<LinkedContentDTO> {
    const data = await apiClient.post(`${this.baseUrl}/linked-content`, request);
    return data;
  }

  /**
   * 获取资源的关联内容
   */
  async getLinkedContents(
    resourceId: string,
  ): Promise<LinkedContentListResponseDTO> {
    const data = await apiClient.get(`${this.baseUrl}/resources/${resourceId}/linked-content`);
    return data;
  }

  /**
   * 创建资源引用
   */
  async createResourceReference(
    request: CreateResourceReferenceRequestDTO,
  ): Promise<ResourceReferenceDTO> {
    const data = await apiClient.post(`${this.baseUrl}/resource-references`, request);
    return data;
  }

  /**
   * 获取资源引用
   */
  async getResourceReferences(
    resourceId: string,
  ): Promise<ResourceReferenceListResponseDTO> {
    const data = await apiClient.get(`${this.baseUrl}/resources/${resourceId}/references`);
    return data;
  }

  /**
   * 获取仓储的文件树（Story 11.1: File Tree Unified Rendering）
   * @param repositoryId 仓储UUID
   * @returns 统一的文件树结构（包含文件夹和资源）
   */
  async getFileTree(repositoryId: string): Promise<any> {
    const data = await apiClient.get(`${this.baseUrl}/${repositoryId}/tree`);
    return data;
  }

  // ===== Folder 文件夹管理 =====

  /**
   * 创建文件夹
   */
  async createFolder(
    repositoryId: string,
    request: CreateFolderRequestDTO,
  ): Promise<FolderDTO> {
    const data = await apiClient.post(`${this.baseUrl}/${repositoryId}/folders`, request);
    return data;
  }

  /**
   * 获取文件夹树
   */
  async getFolderTree(repositoryId: string): Promise<FolderDTO[]> {
    const data = await apiClient.get(`${this.baseUrl}/${repositoryId}/folders/tree`);
    return data;
  }

  /**
   * 获取文件夹详情
   */
  async getFolder(id: string): Promise<FolderDTO> {
    const data = await apiClient.get(`${this.baseUrl}/folders/${id}`);
    return data;
  }

  /**
   * 重命名文件夹
   */
  async renameFolder(id: string, name: string): Promise<FolderDTO> {
    const data = await apiClient.patch(`${this.baseUrl}/folders/${id}/rename`, { name });
    return data;
  }

  /**
   * 移动文件夹
   */
  async moveFolder(
    id: string,
    request: { parentFolderId?: string | null },
  ): Promise<FolderDTO> {
    const data = await apiClient.patch(`${this.baseUrl}/folders/${id}/move`, request);
    return data;
  }

  /**
   * 删除文件夹
   */
  async deleteFolder(id: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/folders/${id}`);
  }
}

// 导出单例实例
export const repositoryApiClient = new RepositoryApiClient();


