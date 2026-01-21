import type { IRepositoryRepository } from '@dailyuse/domain-server/repository';
import { Repository } from '@dailyuse/domain-server/repository';
import type { RepositoryServerDTO, ResourceServerDTO, FolderServerDTO, RepositoryClientDTO, RepositoryConfigServerDTO, RepositoryStatsServerDTO } from '@dailyuse/contracts/repository';
import { RepositoryType, RepositoryStatus } from '@dailyuse/contracts/repository';

/**
 * Repository 应用服务
 * 负责仓储（Repository）的 CRUD 操作
 *
 * 架构职责：
 * - 调用 Repository 进行持久化
 * - DTO 转换（Domain → ClientDTO）
 * - 协调业务用例
 */
export class RepositoryApplicationService {
  private repositoryRepository: IRepositoryRepository;

  constructor(repositoryRepository: IRepositoryRepository) {
    this.repositoryRepository = repositoryRepository;
  }

  /**
   * 创建仓储
   */
  async createRepository(params: {
    accountUuid: string;
    name: string;
    type: RepositoryType;
    path: string;
    description?: string;
    config?: Partial<RepositoryConfigServerDTO>;
  }): Promise<RepositoryClientDTO> {
    // 1. 创建领域实体
    const repository = Repository.create(params);

    // 2. 持久化
    await this.repositoryRepository.save(repository);

    // 3. 返回 ClientDTO
    return repository.toClientDTO();
  }

  /**
   * 获取仓储详情
   */
  async getRepository(uuid: string): Promise<RepositoryClientDTO | null> {
    const repository = await this.repositoryRepository.findByUuid(uuid);
    return repository ? repository.toClientDTO() : null;
  }

  /**
   * 获取用户的所有仓储
   */
  async listRepositories(
    accountUuid: string,
    status?: RepositoryStatus,
  ): Promise<RepositoryClientDTO[]> {
    let repositories: Repository[];

    if (status) {
      repositories = await this.repositoryRepository.findByAccountUuidAndStatus(
        accountUuid,
        status,
      );
    } else {
      repositories = await this.repositoryRepository.findByAccountUuid(accountUuid);
    }

    return repositories.map((r) => r.toClientDTO());
  }

  /**
   * 更新仓储配置
   */
  async updateRepositoryConfig(
    uuid: string,
    config: Partial<RepositoryConfigServerDTO>,
  ): Promise<RepositoryClientDTO> {
    // 1. 查询仓储
    const repository = await this.repositoryRepository.findByUuid(uuid);
    if (!repository) {
      throw new Error(`Repository not found: ${uuid}`);
    }

    // 2. 更新配置（领域方法）
    repository.updateConfig(config);

    // 3. 持久化
    await this.repositoryRepository.save(repository);

    // 4. 返回 ClientDTO
    return repository.toClientDTO();
  }

  /**
   * 更新仓储统计
   */
  async updateRepositoryStats(
    uuid: string,
    stats: Partial<RepositoryStatsServerDTO>,
  ): Promise<RepositoryClientDTO> {
    // 1. 查询仓储
    const repository = await this.repositoryRepository.findByUuid(uuid);
    if (!repository) {
      throw new Error(`Repository not found: ${uuid}`);
    }

    // 2. 更新统计（领域方法）
    repository.updateStats(stats);

    // 3. 持久化
    await this.repositoryRepository.save(repository);

    // 4. 返回 ClientDTO
    return repository.toClientDTO();
  }

  /**
   * 归档仓储
   */
  async archiveRepository(uuid: string): Promise<RepositoryClientDTO> {
    // 1. 查询仓储
    const repository = await this.repositoryRepository.findByUuid(uuid);
    if (!repository) {
      throw new Error(`Repository not found: ${uuid}`);
    }

    // 2. 归档（领域方法）
    repository.archive();

    // 3. 持久化
    await this.repositoryRepository.save(repository);

    // 4. 返回 ClientDTO
    return repository.toClientDTO();
  }

  /**
   * 激活仓储
   */
  async activateRepository(uuid: string): Promise<RepositoryClientDTO> {
    // 1. 查询仓储
    const repository = await this.repositoryRepository.findByUuid(uuid);
    if (!repository) {
      throw new Error(`Repository not found: ${uuid}`);
    }

    // 2. 激活（领域方法）
    repository.activate();

    // 3. 持久化
    await this.repositoryRepository.save(repository);

    // 4. 返回 ClientDTO
    return repository.toClientDTO();
  }

  /**
   * 删除仓储
   */
  async deleteRepository(uuid: string): Promise<void> {
    // 1. 查询仓储
    const repository = await this.repositoryRepository.findByUuid(uuid);
    if (!repository) {
      throw new Error(`Repository not found: ${uuid}`);
    }

    // 2. 软删除（领域方法）
    repository.delete();

    // 3. 持久化
    await this.repositoryRepository.save(repository);
  }
}


