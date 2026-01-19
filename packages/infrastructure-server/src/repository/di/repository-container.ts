import type { 
  IRepositoryRepository, 
  IResourceRepository, 
  IFolderRepository,
  IRepositoryStatisticsRepository,
} from '@dailyuse/domain-server/repository';
import { PrismaRepositoryRepository } from '../repositories/PrismaRepositoryRepository';
import { PrismaResourceRepository } from '../repositories/PrismaResourceRepository';
import { PrismaFolderRepository } from '../repositories/PrismaFolderRepository';
import { prisma } from '@/shared/infrastructure/config/prisma';

/**
 * Repository 模块依赖注入容器
 * 负责管理领域服务和仓储的实例创建和生命周期
 *
 * 采用懒加载模式：
 * - 只在首次调用时创建实例
 * - 后续调用返回已有实例（单例）
 *
 * 支持测试替换：
 * - 允许注入 Mock 仓储用于单元测试
 */
export class RepositoryContainer {
  private static instance: RepositoryContainer;
  private repositoryRepository?: IRepositoryRepository;
  private resourceRepository?: IResourceRepository;
  private folderRepository?: IFolderRepository;
  private repositoryStatisticsRepository?: IRepositoryStatisticsRepository;

  private constructor() {}

  static getInstance(): RepositoryContainer {
    if (!RepositoryContainer.instance) {
      RepositoryContainer.instance = new RepositoryContainer();
    }
    return RepositoryContainer.instance;
  }

  /**
   * 获取 Repository 仓储实例（懒加载）
   */
  getRepositoryRepository(): IRepositoryRepository {
    if (!this.repositoryRepository) {
      this.repositoryRepository = new PrismaRepositoryRepository(prisma);
    }
    return this.repositoryRepository;
  }

  /**
   * 设置 Repository 仓储实例（用于测试）
   */
  setRepositoryRepository(repository: IRepositoryRepository): void {
    this.repositoryRepository = repository;
  }

  /**
   * 获取 Resource 仓储实例（懒加载）
   */
  getResourceRepository(): IResourceRepository {
    if (!this.resourceRepository) {
      this.resourceRepository = new PrismaResourceRepository(prisma);
    }
    return this.resourceRepository;
  }

  /**
   * 设置 Resource 仓储实例（用于测试）
   */
  setResourceRepository(repository: IResourceRepository): void {
    this.resourceRepository = repository;
  }

  /**
   * 获取 Folder 仓储实例（懒加载）
   */
  getFolderRepository(): IFolderRepository {
    if (!this.folderRepository) {
      this.folderRepository = new PrismaFolderRepository(prisma);
    }
    return this.folderRepository;
  }

  /**
   * 设置 Folder 仓储实例（用于测试）
   */
  setFolderRepository(repository: IFolderRepository): void {
    this.folderRepository = repository;
  }

  /**
   * 重置容器（用于测试）
   */
  reset(): void {
    this.repositoryRepository = undefined;
    this.resourceRepository = undefined;
    this.folderRepository = undefined;
    this.repositoryStatisticsRepository = undefined;
  }

  /**
   * 获取 RepositoryStatistics 仓储实例（懒加载）
   * TODO: 实现 PrismaRepositoryStatisticsRepository
   */
  getRepositoryStatisticsRepository(): IRepositoryStatisticsRepository {
    if (!this.repositoryStatisticsRepository) {
      throw new Error('PrismaRepositoryStatisticsRepository not implemented yet');
    }
    return this.repositoryStatisticsRepository;
  }

  /**
   * 设置 RepositoryStatistics 仓储实例（用于测试）
   */
  setRepositoryStatisticsRepository(repository: IRepositoryStatisticsRepository): void {
    this.repositoryStatisticsRepository = repository;
  }

  /**
   * 获取 Repository 聚合仓储实例（别名）
   */
  getRepositoryAggregateRepository(): IRepositoryRepository {
    return this.getRepositoryRepository();
  }
}
