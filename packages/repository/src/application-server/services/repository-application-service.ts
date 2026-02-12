import type { IRepositoryRepository } from '../../domain-server/repositories/IRepositoryRepository';
import { Repository } from '../../domain-server/aggregates/repository';
import type { RepositoryServerDTO, ResourceServerDTO, FolderServerDTO, RepositoryClientDTO, RepositoryConfigServerDTO, RepositoryStatsServerDTO } from '@dailyuse/contracts/repository';
import { RepositoryType, RepositoryStatus } from '@dailyuse/contracts/repository';

/**
 * Repository 搴旂敤鏈嶅姟
 * 璐熻矗Repository锛圧epository锛夌殑 CRUD 鎿嶄綔
 *
 * 鏋舵瀯鑱岃矗锛?
 * - 璋冪敤 Repository 杩涜鎸佷箙鍖?
 * - DTO 杞崲锛圖omain 鈫?ClientDTO锛?
 * - Coordinate business logic
 */
export class RepositoryApplicationService {
  private repositoryRepository: IRepositoryRepository;
  static async getInstance() {
    return new RepositoryApplicationService(null as any);
  }
  constructor(repositoryRepository: IRepositoryRepository) {
    this.repositoryRepository = repositoryRepository;
  }

  /**
   * Create repository
   */
  async createRepository(params: {
    accountUuid: string;
    name: string;
    type: RepositoryType;
    path: string;
    description?: string;
    config?: Partial<RepositoryConfigServerDTO>;
  }): Promise<RepositoryClientDTO> {
    // 1. Create domain entity
    const repository = Repository.create(params);

    // 2. 鎸佷箙鍖?
    await this.repositoryRepository.save(repository);

    // 3. 杩斿洖 ClientDTO
    return repository.toClientDTO();
  }

  /**
   * GetRepository璇︽儏
   */
  async getRepository(uuid: string): Promise<RepositoryClientDTO | null> {
    const repository = await this.repositoryRepository.findByUuid(uuid);
    return repository ? repository.toClientDTO() : null;
  }

  /**
   * Get all repositories of the user?
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
   * UpdateRepository閰嶇疆
   */
  async updateRepositoryConfig(
    uuid: string,
    config: Partial<RepositoryConfigServerDTO>,
  ): Promise<RepositoryClientDTO> {
    // 1. 鏌ヨRepository
    const repository = await this.repositoryRepository.findByUuid(uuid);
    if (!repository) {
      throw new Error(`Repository not found: ${uuid}`);
    }

    // 2. Update閰嶇疆锛堥鍩熸柟娉曪級
    repository.updateConfig(config);

    // 3. 鎸佷箙鍖?
    await this.repositoryRepository.save(repository);

    // 4. 杩斿洖 ClientDTO
    return repository.toClientDTO();
  }

  /**
   * UpdateRepository缁熻
   */
  async updateRepositoryStats(
    uuid: string,
    stats: Partial<RepositoryStatsServerDTO>,
  ): Promise<RepositoryClientDTO> {
    // 1. 鏌ヨRepository
    const repository = await this.repositoryRepository.findByUuid(uuid);
    if (!repository) {
      throw new Error(`Repository not found: ${uuid}`);
    }

    // 2. Update缁熻锛堥鍩熸柟娉曪級
    repository.updateStats(stats);

    // 3. 鎸佷箙鍖?
    await this.repositoryRepository.save(repository);

    // 4. 杩斿洖 ClientDTO
    return repository.toClientDTO();
  }

  /**
   * 褰掓。Repository
   */
  async archiveRepository(uuid: string): Promise<RepositoryClientDTO> {
    // 1. 鏌ヨRepository
    const repository = await this.repositoryRepository.findByUuid(uuid);
    if (!repository) {
      throw new Error(`Repository not found: ${uuid}`);
    }

    // 2. 褰掓。锛堥鍩熸柟娉曪級
    repository.archive();

    // 3. 鎸佷箙鍖?
    await this.repositoryRepository.save(repository);

    // 4. 杩斿洖 ClientDTO
    return repository.toClientDTO();
  }

  /**
   * 婵€娲讳粨鍌?
   */
  async activateRepository(uuid: string): Promise<RepositoryClientDTO> {
    // 1. 鏌ヨRepository
    const repository = await this.repositoryRepository.findByUuid(uuid);
    if (!repository) {
      throw new Error(`Repository not found: ${uuid}`);
    }

    // 2. 婵€娲伙紙棰嗗煙鏂规硶锛?
    repository.activate();

    // 3. 鎸佷箙鍖?
    await this.repositoryRepository.save(repository);

    // 4. 杩斿洖 ClientDTO
    return repository.toClientDTO();
  }

  /**
   * Delete repository
   */
  async deleteRepository(uuid: string): Promise<void> {
    // 1. 鏌ヨRepository
    const repository = await this.repositoryRepository.findByUuid(uuid);
    if (!repository) {
      throw new Error(`Repository not found: ${uuid}`);
    }

    // 2. 杞垹闄わ紙棰嗗煙鏂规硶锛?
    repository.delete();

    // 3. 鎸佷箙鍖?
    await this.repositoryRepository.save(repository);
  }
}



