/**
 * Repository Module - Infrastructure Server
 *
 * Repository implementations and DI Module for Repository domain.
 * Supports both Prisma (API) and SQLite (Desktop) data sources.
 */
// Module (Composition Pattern - ADR-025)
export { RepositoryModule } from './repository.module';

// Repository Factory
export { RepositoryRepositoryFactory } from './di/repository-repository.factory';

// Legacy Container (for backward compatibility)
export { RepositoryContainer } from './repository.container';

// Ports (Interfaces)
export { type IFolderRepository } from './ports/folder-repository.port';
export { type IRepositoryRepository } from './ports/repository-repository.port';
export { type IRepositoryStatisticsRepository } from './ports/repository-statistics-repository.port';
export { type IResourceRepository } from './ports/resource-repository.port';

// Database Provider Factory (鏍稿績鏂板)
export {
  DatabaseProviderFactory,
  DatabaseProvider,
  initializePrismaProvider,
  initializeSqliteProvider,
  type IDatabaseProviderConfig,
  type IProviderInitContext,
  type IProviderInitializer,
} from './database-provider-factory';

// Provider Initializers
export { PrismaProviderInitializer } from './providers/prisma-provider';
export { MemoryProviderInitializer } from './providers/memory-provider';
// SQLite provider has been moved to @dailyuse/infrastructure-desktop
// export { SqliteProviderInitializer } from './providers/sqlite-provider';

// Prisma Adapters
export { FolderPrismaRepository } from './adapters/prisma/folder-prisma.repository';
export { RepositoryPrismaRepository } from './adapters/prisma/repository-prisma.repository';
export { RepositoryStatisticsPrismaRepository } from './adapters/prisma/repository-statistics-prisma.repository';
export { ResourcePrismaRepository } from './adapters/prisma/resource-prisma.repository';

// SQLite Adapters
export { SqliteRepositoryRepository } from './adapters/sqlite/repository-sqlite.repository';
export { SqliteFolderRepository } from './adapters/sqlite/folder-sqlite.repository';
export { SqliteRepositoryStatisticsRepository } from './adapters/sqlite/repository-statistics-sqlite.repository';
export { SqliteResourceRepository } from './adapters/sqlite/resource-sqlite.repository';

// Memory Adapters
export { FolderMemoryRepository } from './adapters/memory/folder-memory.repository';
export { RepositoryMemoryRepository } from './adapters/memory/repository-memory.repository';
export { RepositoryStatisticsMemoryRepository } from './adapters/memory/repository-statistics-memory.repository';
export { ResourceMemoryRepository } from './adapters/memory/resource-memory.repository';

// Initialization Scripts
export {
  initializeApiRepositories,
  cleanupApiRepositories,
  healthCheckApiRepositories,
} from './initialization/initialize-api';
