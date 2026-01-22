/**
 * SQLite Provider Initializer
 *
 * 为 SQLite 数据库提供者初始化所有仓储实现
 */

import type {
  IRepositoryRepository,
  IResourceRepository,
  IFolderRepository,
  IRepositoryStatisticsRepository,
} from '@dailyuse/domain-server/repository';

import { SqliteRepositoryRepository } from '../repositories/sqlite-repository.repository';
import { SqliteResourceRepository } from '../repositories/sqlite-resource.repository';
import { SqliteFolderRepository } from '../repositories/sqlite-folder.repository';
import { SqliteRepositoryStatisticsRepository } from '../repositories/sqlite-repository-statistics.repository';

import type { RepositoryContainer } from '@dailyuse/infrastructure-server/repository';
import { SqliteDatabase, type ISqliteConfig } from '../../shared/config/sqlite-database';

export interface ISqliteProviderConfig extends ISqliteConfig {
  /** 可选的已初始化的数据库实例 */
  sqliteDb?: any;
}

/**
 * SQLite 提供者初始化器
 *
 * 职责：
 * - 创建或使用现有 SQLite 数据库连接
 * - 创建所有 SQLite 仓储实现
 * - 将实现注册到容器中
 */
export class SqliteProviderInitializer {
  private db: SqliteDatabase | null = null;

  async initialize(
    config: ISqliteProviderConfig,
    container: RepositoryContainer,
  ): Promise<void> {
    // 使用提供的数据库或创建新的
    if (config.sqliteDb) {
      // 使用已存在的数据库实例
      const sqliteDb = config.sqliteDb;

      const repositoryRepository: IRepositoryRepository = new SqliteRepositoryRepository(
        sqliteDb,
      );
      const resourceRepository: IResourceRepository = new SqliteResourceRepository(sqliteDb);
      const folderRepository: IFolderRepository = new SqliteFolderRepository(sqliteDb);
      const statisticsRepository: IRepositoryStatisticsRepository =
        new SqliteRepositoryStatisticsRepository(sqliteDb);

      container.registerRepositoryRepository(repositoryRepository);
      container.registerResourceRepository(resourceRepository);
      container.registerFolderRepository(folderRepository);
      container.registerRepositoryStatisticsRepository(statisticsRepository);

      console.log('✅ SQLite provider initialized with existing database');
    } else {
      // 创建新的数据库连接
      this.db = new SqliteDatabase({
        dbPath: config.dbPath,
        autoMigrate: config.autoMigrate ?? true,
        verbose: config.verbose ?? false,
      });

      this.db.initialize();
      const sqliteDb = this.db.getDatabase();

      const repositoryRepository: IRepositoryRepository = new SqliteRepositoryRepository(
        sqliteDb,
      );
      const resourceRepository: IResourceRepository = new SqliteResourceRepository(sqliteDb);
      const folderRepository: IFolderRepository = new SqliteFolderRepository(sqliteDb);
      const statisticsRepository: IRepositoryStatisticsRepository =
        new SqliteRepositoryStatisticsRepository(sqliteDb);

      container.registerRepositoryRepository(repositoryRepository);
      container.registerResourceRepository(resourceRepository);
      container.registerFolderRepository(folderRepository);
      container.registerRepositoryStatisticsRepository(statisticsRepository);

      console.log(`✅ SQLite provider initialized with database at ${config.dbPath}`);
    }
  }

  async cleanup(): Promise<void> {
    if (this.db) {
      this.db.close();
      console.log('✅ SQLite provider cleaned up');
    }
  }

  async healthCheck(): Promise<boolean> {
    if (this.db) {
      return this.db.healthCheck();
    }
    return true;
  }
}
