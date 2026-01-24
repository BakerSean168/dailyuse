/**
 * Prisma Provider Initializer
 *
 * 涓?Prisma 鏁版嵁搴撴彁渚涜€呭垵濮嬪寲All鏈変粨鍌ㄥ疄鐜?
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
 * Prisma 鎻愪緵鑰呭垵濮嬪寲鍣?
 *
 * 鑱岃矗锛?
 * - CreateAll鏈?Prisma Repository瀹炵幇
 * - 灏嗗疄鐜版敞鍐屽埌瀹瑰櫒涓?
 * - 绠＄悊 Prisma 杩炴帴鐨勭敓鍛藉懆鏈?
 */
export class PrismaProviderInitializer implements IProviderInitializer {
  private prisma: any;

  async initialize(context: IProviderInitContext): Promise<void> {
    const { config, container } = context;

    if (!config.prisma) {
      throw new Error('Prisma client instance is required for Prisma provider');
    }

    this.prisma = config.prisma;

    // CreateAll鏈?Prisma Repository瀹炵幇
    const repositoryRepository: IRepositoryRepository = new RepositoryPrismaRepository(
      this.prisma,
    );
    const resourceRepository: IResourceRepository = new ResourcePrismaRepository(this.prisma);
    const folderRepository: IFolderRepository = new FolderPrismaRepository(this.prisma);
    const statisticsRepository: IRepositoryStatisticsRepository =
      new RepositoryStatisticsPrismaRepository(this.prisma);

    // 娉ㄥ唽鍒板鍣?
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

    console.log('鉁?Prisma provider initialized successfully');
  }

  async cleanup(): Promise<void> {
    if (this.prisma && typeof this.prisma.$disconnect === 'function') {
      await this.prisma.$disconnect();
      console.log('鉁?Prisma provider cleaned up');
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      if (this.prisma) {
        // 鎵ц绠€鍗曟煡璇㈡鏌ヨ繛鎺?
        await this.prisma.$queryRaw`SELECT 1`;
        return true;
      }
      return false;
    } catch (error) {
      console.error('鉂?Prisma health check failed:', error);
      return false;
    }
  }
}
