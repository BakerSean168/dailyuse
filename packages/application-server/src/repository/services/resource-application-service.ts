/**
 * Resource Application Service
 * Resource 应用服务 - Story 10-2
 */
import { v4 as uuidv4 } from 'uuid';
import { Resource } from '@dailyuse/domain-server/repository';
import type { IResourceRepository } from '@dailyuse/domain-server/repository';
import { ResourceType } from '@dailyuse/contracts/repository';
import type { RepositoryServerDTO, ResourceServerDTO, FolderServerDTO, ResourceClientDTO } from '@dailyuse/contracts/repository';


/**
 * Resource 应用服务
 * 负责 Resource 的业务用例协调
 *
 * 架构职责：
 * - 调用 Repository 进行持久化
 * - DTO 转换（Domain → ClientDTO）
 * - 协调业务用例
 */
export class ResourceApplicationService {
  private resourceRepository: IResourceRepository;

  constructor(resourceRepository: IResourceRepository) {
    this.resourceRepository = resourceRepository;
  }

  async createResource(params: {
    repositoryUuid: string;
    folderUuid?: string;
    name: string;
    type: ResourceType;
    path: string;
    content?: string;
  }): Promise<ResourceClientDTO> {
    const exists = await this.resourceRepository.existsByPath(params.repositoryUuid, params.path);
    if (exists) {
      throw new Error(`Resource already exists at path: ${params.path}`);
    }

    const resource = Resource.create({
      uuid: uuidv4(),
      repositoryUuid: params.repositoryUuid,
      folderUuid: params.folderUuid,
      name: params.name,
      type: params.type,
      path: params.path,
      content: params.content,
    });

    if (params.content) {
      resource.activate();
    }

    await this.resourceRepository.save(resource);
    return resource.toClientDTO();
  }

  async updateMarkdownContent(uuid: string, content: string): Promise<ResourceClientDTO> {
    const resource = await this.resourceRepository.findById(uuid);
    if (!resource) throw new Error(`Resource not found: ${uuid}`);

    resource.updateMarkdownContent(content);
    await this.resourceRepository.save(resource);
    return resource.toClientDTO();
  }

  async getResourceById(uuid: string): Promise<ResourceClientDTO | null> {
    const resource = await this.resourceRepository.findById(uuid);
    if (!resource) return null;
    return resource.toClientDTO();
  }

  async getResourcesByRepository(repositoryUuid: string): Promise<ResourceClientDTO[]> {
    const resources = await this.resourceRepository.findByRepositoryUuid(repositoryUuid);
    return resources.map((r) => r.toClientDTO());
  }

  async deleteResource(uuid: string): Promise<void> {
    const resource = await this.resourceRepository.findById(uuid);
    if (!resource) throw new Error(`Resource not found: ${uuid}`);
    resource.delete();
    await this.resourceRepository.save(resource);
  }
}


