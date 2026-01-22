/**
 * Memory Provider Initializer
 *
 * 为内存数据库提供者初始化所有仓储实现（用于测试）
 */

import type {
  IRepositoryRepository,
  IResourceRepository,
  IFolderRepository,
  IRepositoryStatisticsRepository,
} from '@dailyuse/domain-server/repository';

import { RepositoryMemoryRepository } from '../adapters/memory/repository-memory.repository';
import { ResourceMemoryRepository } from '../adapters/memory/resource-memory.repository';
import { FolderMemoryRepository } from '../adapters/memory/folder-memory.repository';
import { RepositoryStatisticsMemoryRepository } from '../adapters/memory/repository-statistics-memory.repository';

import type {
  IProviderInitContext,
  IProviderInitializer,
} from '../database-provider-factory';

/**
 * Memory 提供者初始化器
 *
 * 职责：
 * - 创建所有 Memory 仓储实现
 * - 将实现注册到容器中
 * - 主要用于单元测试
 */
export class MemoryProviderInitializer implements IProviderInitializer {
  async initialize(context: IProviderInitContext): Promise<void> {
    const { container } = context;

    // 创建所有 Memory 仓储实现
    const repositoryRepository: IRepositoryRepository = new RepositoryMemoryRepository();
    const resourceRepository: IResourceRepository = new ResourceMemoryRepository();
    const folderRepository: IFolderRepository = new FolderMemoryRepository();
    const statisticsRepository: IRepositoryStatisticsRepository =
      new RepositoryStatisticsMemoryRepository();

    // 注册到容器
    container.registerRepositoryRepository(repositoryRepository);
    container.registerResourceRepository(resourceRepository);
    container.registerFolderRepository(folderRepository);
    container.registerRepositoryStatisticsRepository(statisticsRepository);

    console.log('✅ Memory provider initialized successfully (testing mode)');
  }

  async cleanup(): Promise<void> {
    console.log('✅ Memory provider cleaned up');
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }
}
