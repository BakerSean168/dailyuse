/**
 * Resource API Client
 * Epic 10 Story 10-2: Resource CRUD + Markdown 编辑器
 */
import type { IApiClient } from '@/shared/api/core/types';
import type { RepositoryServerDTO, ResourceServerDTO, ResourceClientDTO } from '@dailyuse/contracts/repository';


export interface CreateResourceDTO {
  repositoryUuid: string;
  name: string;
  type: string;
  path: string;
  folderUuid?: string;
  content?: string;
}

export interface UpdateMarkdownContentDTO {
  content: string;
}

export class ResourceApiClient {
  private readonly baseUrl = '/repositories';

  constructor(private readonly api: IApiClient) {}

  /**
   * 创建资源
   */
  async createResource(dto: CreateResourceDTO): Promise<ResourceClientDTO> {
    return await this.api.post<ResourceClientDTO>(`${this.baseUrl}/resources`, dto);
  }

  /**
   * 获取资源详情
   */
  async getResourceById(uuid: string): Promise<ResourceClientDTO> {
    return await this.api.get<ResourceClientDTO>(`${this.baseUrl}/resources/${uuid}`);
  }

  /**
   * 获取仓库下的所有资源
   */
  async getResourcesByRepository(repositoryUuid: string): Promise<ResourceClientDTO[]> {
    return await this.api.get<ResourceClientDTO[]>(
      `${this.baseUrl}/${repositoryUuid}/resources`
    );
  }

  /**
   * 更新 Markdown 内容 (Story 10-2 核心功能)
   */
  async updateMarkdownContent(
    uuid: string,
    content: string
  ): Promise<void> {
    await this.api.put(`${this.baseUrl}/resources/${uuid}/content`, { content });
  }

  /**
   * 删除资源 (软删除)
   */
  async deleteResource(uuid: string): Promise<void> {
    await this.api.delete(`${this.baseUrl}/resources/${uuid}`);
  }
}


