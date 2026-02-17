/**
 * Repository Module - Infrastructure Server
 *
 * Repository implementations and DI Module for Repository domain.
 * Supports both Prisma (API) and SQLite (Desktop) data sources.
 */
// Module (Composition Pattern - ADR-025)
export { RepositoryModule } from './repository.module';
export { RepositoryContainer } from './di/repository-container-v2';

// Repository Factory
export { RepositoryRepositoryFactory } from './di/repository-repository.factory';

// Ports (Interfaces)
export { type IFolderRepository, type IRepositoryRepository, type IResourceRepository } from '../domain-server';

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

// Prisma Adapters
export { FolderPrismaRepository } from './adapters/prisma/folder-prisma.repository';
export { RepositoryPrismaRepository } from './adapters/prisma/repository-prisma.repository';
export { ResourcePrismaRepository } from './adapters/prisma/resource-prisma.repository';

// SQLite Adapters
export { SqliteRepositoryRepository } from './adapters/sqlite/repository-sqlite.repository';
export { SqliteFolderRepository } from './adapters/sqlite/folder-sqlite.repository';
export { SqliteResourceRepository } from './adapters/sqlite/resource-sqlite.repository';
export { REPOSITORY_MODULE_SCHEMA } from './adapters/sqlite/schema';

// Memory Adapters
export { FolderMemoryRepository } from './adapters/memory/folder-memory.repository';
export { RepositoryMemoryRepository } from './adapters/memory/repository-memory.repository';
export { ResourceMemoryRepository } from './adapters/memory/resource-memory.repository';

// Initialization Scripts
export {
  initializeApiRepositories,
  cleanupApiRepositories,
  healthCheckApiRepositories,
} from './initialization/initialize-api';
