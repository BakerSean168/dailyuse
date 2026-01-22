/**
 * SQLite Provider Initializer (for infrastructure-server)
 *
 * 支持在 infrastructure-server 中使用 SQLite（可选）
 * 主要提供给需要支持多数据库的应用程序使用
 */

import type {
  IRepositoryRepository,
  IResourceRepository,
  IFolderRepository,
  IRepositoryStatisticsRepository,
} from '@dailyuse/domain-server/repository';

import type {
  IProviderInitContext,
  IProviderInitializer,
  IDatabaseProviderConfig,
} from '../database-provider-factory';

/**
 * SQLite 提供者初始化器（基础实现）
 *
 * 注意：完整的 SQLite 实现在 infrastructure-desktop 包中
 * 这里只提供基础框架，允许在 infrastructure-server 中使用 SQLite
 */
export class SqliteProviderInitializer implements IProviderInitializer {
  private sqliteDb: any = null;

  async initialize(context: IProviderInitContext): Promise<void> {
    const { config, container } = context;

    // 动态导入 better-sqlite3 以避免生产依赖
    let Database: any;
    try {
      Database = require('better-sqlite3');
    } catch (error) {
      throw new Error(
        'better-sqlite3 is not installed. ' +
          'Install it with: pnpm add better-sqlite3',
      );
    }

    const sqliteDbPath =
      config.sqliteDbPath ||
      config.sqliteDb ||
      ':memory:';

    this.sqliteDb = new Database(sqliteDbPath);
    this.sqliteDb.pragma('foreign_keys = ON');
    this.sqliteDb.pragma('journal_mode = WAL');

    // 动态导入 SQLite 仓储实现
    const {
      SqliteRepositoryRepository,
    } = await import('@dailyuse/infrastructure-desktop/repository');
    const {
      SqliteResourceRepository,
    } = await import('@dailyuse/infrastructure-desktop/repository');
    const {
      SqliteFolderRepository,
    } = await import('@dailyuse/infrastructure-desktop/repository');
    const {
      SqliteRepositoryStatisticsRepository,
    } = await import('@dailyuse/infrastructure-desktop/repository');

    // 创建所有 SQLite 仓储实现
    const repositoryRepository: IRepositoryRepository = new SqliteRepositoryRepository(
      this.sqliteDb,
    );
    const resourceRepository: IResourceRepository = new SqliteResourceRepository(
      this.sqliteDb,
    );
    const folderRepository: IFolderRepository = new SqliteFolderRepository(
      this.sqliteDb,
    );
    const statisticsRepository: IRepositoryStatisticsRepository =
      new SqliteRepositoryStatisticsRepository(this.sqliteDb);

    // 注册到容器
    container.registerRepositoryRepository(repositoryRepository);
    container.registerResourceRepository(resourceRepository);
    container.registerFolderRepository(folderRepository);
    container.registerRepositoryStatisticsRepository(statisticsRepository);

    console.log(`✅ SQLite provider initialized at: ${sqliteDbPath}`);
  }

  async cleanup(): Promise<void> {
    if (this.sqliteDb) {
      this.sqliteDb.close();
      console.log('✅ SQLite provider cleaned up');
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      if (this.sqliteDb) {
        const result = this.sqliteDb.prepare('SELECT 1').get();
        return !!result;
      }
      return false;
    } catch (error) {
      console.error('❌ SQLite health check failed:', error);
      return false;
    }
  }
}
