import type { 
  IRepositoryRepository, 
  IResourceRepository, 
  IFolderRepository,
  IRepositoryStatisticsRepository,
} from '@dailyuse/domain-server/repository';

/**
 * Repository 模块依赖注入容器
 * 负责管理领域服务和仓储的实例创建和生命周期
 *
 * 设计原则（改进版）：
 * 1. 支持多数据库提供者（Prisma、SQLite、Memory 等）
 * 2. 支持动态注册实现（不再依赖硬编码的 Prisma）
 * 3. 支持测试替换（Mock 仓储）
 * 4. 支持懒加载（首次调用时创建）
 * 5. 支持重置（用于测试）
 *
 * 使用场景：
 * - API 项目：通过 DatabaseProviderFactory 注册 Prisma 实现
 * - Desktop 项目：通过 DatabaseProviderFactory 注册 SQLite 实现
 * - 测试：直接注入 Mock 实现
 */
export class RepositoryContainer {
  private static instance: RepositoryContainer;
  private repositoryRepository?: IRepositoryRepository;
  private resourceRepository?: IResourceRepository;
  private folderRepository?: IFolderRepository;
  private repositoryStatisticsRepository?: IRepositoryStatisticsRepository;

  private constructor() {}

  /**
   * 获取容器单例
   */
  static getInstance(): RepositoryContainer {
    if (!RepositoryContainer.instance) {
      RepositoryContainer.instance = new RepositoryContainer();
    }
    return RepositoryContainer.instance;
  }

  /**
   * 重置单例（用于切换提供者或测试）
   */
  static resetInstance(): void {
    RepositoryContainer.instance = new RepositoryContainer();
  }

  // ===== Repository 仓储 =====

  /**
   * 注册 Repository 仓储实现
   */
  registerRepositoryRepository(repository: IRepositoryRepository): this {
    this.repositoryRepository = repository;
    return this;
  }

  /**
   * 获取 Repository 仓储实例
   */
  getRepositoryRepository(): IRepositoryRepository {
    if (!this.repositoryRepository) {
      throw new Error(
        'Repository repository not initialized. ' +
          'Please initialize the database provider using DatabaseProviderFactory.initializeProvider()',
      );
    }
    return this.repositoryRepository;
  }

  // ===== Resource 仓储 =====

  /**
   * 注册 Resource 仓储实现
   */
  registerResourceRepository(repository: IResourceRepository): this {
    this.resourceRepository = repository;
    return this;
  }

  /**
   * 获取 Resource 仓储实例
   */
  getResourceRepository(): IResourceRepository {
    if (!this.resourceRepository) {
      throw new Error(
        'Resource repository not initialized. ' +
          'Please initialize the database provider using DatabaseProviderFactory.initializeProvider()',
      );
    }
    return this.resourceRepository;
  }

  // ===== Folder 仓储 =====

  /**
   * 注册 Folder 仓储实现
   */
  registerFolderRepository(repository: IFolderRepository): this {
    this.folderRepository = repository;
    return this;
  }

  /**
   * 获取 Folder 仓储实例
   */
  getFolderRepository(): IFolderRepository {
    if (!this.folderRepository) {
      throw new Error(
        'Folder repository not initialized. ' +
          'Please initialize the database provider using DatabaseProviderFactory.initializeProvider()',
      );
    }
    return this.folderRepository;
  }

  // ===== Repository Statistics 仓储 =====

  /**
   * 注册 RepositoryStatistics 仓储实现
   */
  registerRepositoryStatisticsRepository(repository: IRepositoryStatisticsRepository): this {
    this.repositoryStatisticsRepository = repository;
    return this;
  }

  /**
   * 获取 RepositoryStatistics 仓储实例
   */
  getRepositoryStatisticsRepository(): IRepositoryStatisticsRepository {
    if (!this.repositoryStatisticsRepository) {
      throw new Error(
        'Repository statistics repository not initialized. ' +
          'Please initialize the database provider using DatabaseProviderFactory.initializeProvider()',
      );
    }
    return this.repositoryStatisticsRepository;
  }

  // ===== 别名方法（兼容性） =====

  /**
   * 获取 Repository 聚合仓储实例（别名）
   */
  getRepositoryAggregateRepository(): IRepositoryRepository {
    return this.getRepositoryRepository();
  }

  // ===== 工具方法 =====

  /**
   * 重置容器（用于测试或切换提供者）
   */
  reset(): void {
    this.repositoryRepository = undefined;
    this.resourceRepository = undefined;
    this.folderRepository = undefined;
    this.repositoryStatisticsRepository = undefined;
  }

  /**
   * 检查是否已初始化
   */
  isInitialized(): boolean {
    return !!(
      this.repositoryRepository &&
      this.resourceRepository &&
      this.folderRepository &&
      this.repositoryStatisticsRepository
    );
  }

  /**
   * 检查是否部分初始化
   */
  isPartiallyInitialized(): boolean {
    return !!(
      this.repositoryRepository ||
      this.resourceRepository ||
      this.folderRepository ||
      this.repositoryStatisticsRepository
    );
  }
}
