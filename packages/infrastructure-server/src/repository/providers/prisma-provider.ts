/**
 * Prisma Provider Initializer
 *
 * 为 Prisma 数据库提供者初始化所有仓储实现
 */

import type {
  IRepositoryRepository,
  IResourceRepository,
  IFolderRepository,
  IRepositoryStatisticsRepository,
} from '@dailyuse/domain-server/repository';

import { RepositoryPrismaRepository } from '../adapters/prisma/repository-prisma.repository';
import { ResourcePrismaRepository } from '../adapters/prisma/resource-prisma.repository';
import { FolderPrismaRepository } from '../adapters/prisma/folder-prisma.repository';
import { RepositoryStatisticsPrismaRepository } from '../adapters/prisma/repository-statistics-prisma.repository';

import type { RepositoryContainer } from '../repository.container';
import type {
  IProviderInitContext,
  IProviderInitializer,
} from '../database-provider-factory';

/**
 * Prisma 提供者初始化器
 *
 * 职责：
 * - 创建所有 Prisma 仓储实现
 * - 将实现注册到容器中
 * - 管理 Prisma 连接的生命周期
 */
export class PrismaProviderInitializer implements IProviderInitializer {
  private prisma: any;

  async initialize(context: IProviderInitContext): Promise<void> {
    const { config, container } = context;

    if (!config.prisma) {
      throw new Error('Prisma client instance is required for Prisma provider');
    }

    this.prisma = config.prisma;

    // 创建所有 Prisma 仓储实现
    const repositoryRepository: IRepositoryRepository = new RepositoryPrismaRepository(
      this.prisma,
    );
    const resourceRepository: IResourceRepository = new ResourcePrismaRepository(this.prisma);
    const folderRepository: IFolderRepository = new FolderPrismaRepository(this.prisma);
    const statisticsRepository: IRepositoryStatisticsRepository =
      new RepositoryStatisticsPrismaRepository(this.prisma);

    // 注册到容器
    (container as unknown as RepositoryContainer).registerRepositoryRepository(
      repositoryRepository,
    );
    (container as unknown as RepositoryContainer).registerResourceRepository(
      resourceRepository,
    );
    (container as unknown as RepositoryContainer).registerFolderRepository(folderRepository);
    (container as unknown as RepositoryContainer).registerRepositoryStatisticsRepository(
      statisticsRepository,
    );

    console.log('✅ Prisma provider initialized successfully');
  }

  async cleanup(): Promise<void> {
    if (this.prisma && typeof this.prisma.$disconnect === 'function') {
      await this.prisma.$disconnect();
      console.log('✅ Prisma provider cleaned up');
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      if (this.prisma) {
        // 执行简单查询检查连接
        await this.prisma.$queryRaw`SELECT 1`;
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Prisma health check failed:', error);
      return false;
    }
  }
}
