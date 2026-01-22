/**
 * 多数据库适配架构使用指南
 *
 * 这个文档展示了如何在 API 和 Desktop 应用中使用新的数据库提供者工厂
 */

// ============================================================================
// 1. API 应用启动示例（使用 Prisma）
// ============================================================================

import {
  initializeApiRepositories,
  cleanupApiRepositories,
  RepositoryContainer,
} from '@dailyuse/infrastructure-server/repository';

// 在你的 main.ts 或 bootstrap 文件中
export async function bootstrapApiApplication() {
  try {
    // 初始化仓储层
    const provider = await initializeApiRepositories();

    // 现在你可以在应用的任何地方使用仓储
    const container = RepositoryContainer.getInstance();
    const repositoryRepo = container.getRepositoryRepository();
    const resourceRepo = container.getResourceRepository();
    // ... 等等

    // 优雅关闭时清理
    process.on('SIGTERM', async () => {
      await cleanupApiRepositories(provider);
      process.exit(0);
    });
  } catch (error) {
    console.error('Failed to bootstrap API:', error);
    process.exit(1);
  }
}

// ============================================================================
// 2. Desktop 应用启动示例（使用 SQLite）
// ============================================================================

import {
  initializeDesktopRepositories,
  cleanupDesktopRepositories,
  DesktopRepositoryContainer,
} from '@dailyuse/infrastructure-desktop/repository';
import path from 'path';

export async function bootstrapDesktopApplication() {
  try {
    // 确定数据库路径
    const appDataDir = process.env.APPDATA || process.env.HOME || '.';
    const dbPath = path.join(appDataDir, 'MyApp', 'database.db');

    // 初始化 Desktop 仓储层
    const { provider, desktopContainer } = await initializeDesktopRepositories(dbPath);

    // 使用基础容器访问仓储
    const baseContainer = desktopContainer.getBaseContainer();
    const repositoryRepo = baseContainer.getRepositoryRepository();
    const resourceRepo = baseContainer.getResourceRepository();
    // ... 等等

    // 优雅关闭时清理
    window.addEventListener('beforeunload', async () => {
      await cleanupDesktopRepositories(provider, desktopContainer);
    });
  } catch (error) {
    console.error('Failed to bootstrap Desktop app:', error);
  }
}

// ============================================================================
// 3. 在应用中使用仓储
// ============================================================================

import { RepositoryContainer } from '@dailyuse/infrastructure-server/repository';
import { Repository } from '@dailyuse/domain-server/repository';

export class RepositoryService {
  private container = RepositoryContainer.getInstance();

  async createRepository(params: {
    accountUuid: string;
    name: string;
    description?: string;
  }): Promise<void> {
    // 创建聚合根
    const repository = Repository.create({
      accountUuid: params.accountUuid,
      name: params.name,
      description: params.description,
    });

    // 通过仓储保存
    const repositoryRepo = this.container.getRepositoryRepository();
    await repositoryRepo.save(repository);
  }

  async findUserRepositories(accountUuid: string): Promise<Repository[]> {
    const repositoryRepo = this.container.getRepositoryRepository();
    return repositoryRepo.findByAccountUuid(accountUuid);
  }
}

// ============================================================================
// 4. 单元测试示例（使用 Memory 提供者）
// ============================================================================

import {
  DatabaseProviderFactory,
  DatabaseProvider,
  RepositoryContainer,
} from '@dailyuse/infrastructure-server/repository';
import { describe, it, beforeEach, afterEach } from 'vitest';

describe('RepositoryService', () => {
  let provider: any;

  beforeEach(async () => {
    // 使用 Memory 提供者进行测试
    const factory = DatabaseProviderFactory.getInstance();
    const container = RepositoryContainer.getInstance();
    container.reset(); // 清空之前的初始化

    provider = await factory.initializeProvider(
      { provider: DatabaseProvider.MEMORY },
      container,
    );
  });

  afterEach(async () => {
    await provider.cleanup();
    RepositoryContainer.getInstance().reset();
  });

  it('should create and retrieve repository', async () => {
    const service = new RepositoryService();

    await service.createRepository({
      accountUuid: 'test-account',
      name: 'Test Repository',
    });

    const repositories = await service.findUserRepositories('test-account');
    expect(repositories).toHaveLength(1);
    expect(repositories[0].name).toBe('Test Repository');
  });
});

// ============================================================================
// 5. 多提供者切换示例（高级用法）
// ============================================================================

import {
  DatabaseProviderFactory,
  DatabaseProvider,
} from '@dailyuse/infrastructure-server/repository';

export class MultiProviderApp {
  async switchToProduction() {
    const factory = DatabaseProviderFactory.getInstance();
    const container = RepositoryContainer.getInstance();
    container.reset(); // 重置之前的提供者

    // 切换到 Prisma（生产环境）
    const provider = await factory.initializeProvider(
      { provider: DatabaseProvider.PRISMA, prisma: yourPrismaInstance },
      container,
    );
    return provider;
  }

  async switchToDevelopment() {
    const factory = DatabaseProviderFactory.getInstance();
    const container = RepositoryContainer.getInstance();
    container.reset();

    // 切换到内存提供者（开发环境）
    const provider = await factory.initializeProvider(
      { provider: DatabaseProvider.MEMORY },
      container,
    );
    return provider;
  }

  async switchToLocalStorage() {
    const factory = DatabaseProviderFactory.getInstance();
    const container = RepositoryContainer.getInstance();
    container.reset();

    // 切换到 SQLite（本地存储）
    const provider = await factory.initializeProvider(
      { provider: DatabaseProvider.SQLITE, sqliteDbPath: './local.db' },
      container,
    );
    return provider;
  }
}

// ============================================================================
// 6. 扩展和自定义提供者
// ============================================================================

import type {
  IProviderInitializer,
  IProviderInitContext,
} from '@dailyuse/infrastructure-server/repository';

/**
 * 自定义数据库提供者示例（如 MongoDB）
 */
class MongoDbProviderInitializer implements IProviderInitializer {
  async initialize(context: IProviderInitContext): Promise<void> {
    const { config, container } = context;

    // 创建 MongoDB 仓储实现
    const mongoDbClient = await connectToMongoDB(config.mongoUri);

    const repositoryRepository = new MongoDbRepositoryRepository(mongoDbClient);
    const resourceRepository = new MongoDbResourceRepository(mongoDbClient);
    // ... 等等

    // 注册到容器
    container.registerRepositoryRepository(repositoryRepository);
    container.registerResourceRepository(resourceRepository);
    // ... 等等
  }

  async cleanup(): Promise<void> {
    // 断开连接等清理工作
  }

  async healthCheck(): Promise<boolean> {
    // 检查连接健康状态
    return true;
  }
}

// 注册自定义提供者
DatabaseProviderFactory.registerProvider('mongodb', MongoDbProviderInitializer);

// 使用自定义提供者
async function useMongoDb() {
  const factory = DatabaseProviderFactory.getInstance();
  const container = RepositoryContainer.getInstance();

  const provider = await factory.initializeProvider(
    {
      provider: 'mongodb',
      mongoUri: 'mongodb://localhost:27017/mydb',
    },
    container,
  );
}
