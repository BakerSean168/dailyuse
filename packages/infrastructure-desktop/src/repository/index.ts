/**
 * Desktop Repository Module Index
 *
 * 导出所有 Desktop 基础设施的仓储相关类和接口
 */

// SQLite 数据库
export { SqliteDatabase, type ISqliteConfig } from '../shared/config/sqlite-database';

// SQLite 仓储实现
export { SqliteRepositoryRepository } from './repositories/sqlite-repository.repository';
export { SqliteResourceRepository } from './repositories/sqlite-resource.repository';
export { SqliteFolderRepository } from './repositories/sqlite-folder.repository';
export { SqliteRepositoryStatisticsRepository } from './repositories/sqlite-repository-statistics.repository';

// SQLite 提供者
export {
  SqliteProviderInitializer,
  type ISqliteProviderConfig,
} from './providers/sqlite-provider';

// DI 容器
export { DesktopRepositoryContainer } from './di/desktop-repository-container';

// 初始化脚本
export {
  initializeDesktopRepositories,
  cleanupDesktopRepositories,
  healthCheckDesktopRepositories,
} from './initialization/initialize-desktop';

// 仓储接口（从 domain-server 重导出）
export type {
  IRepositoryRepository,
  IResourceRepository,
  IFolderRepository,
  IRepositoryStatisticsRepository,
} from '@dailyuse/domain-server/repository';

// 从 infrastructure-server 重导出，支持多提供者
export type {
  DatabaseProvider,
  IDatabaseProviderConfig,
  IProviderInitContext,
  IProviderInitializer,
} from '@dailyuse/infrastructure-server/repository';
export { DatabaseProviderFactory } from '@dailyuse/infrastructure-server/repository';
