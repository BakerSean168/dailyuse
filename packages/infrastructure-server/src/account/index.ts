/**
 * Account Module - Infrastructure Server
 *
 * Ports and Adapters for Account module persistence.
 * Supports both Prisma (API) and SQLite (Desktop) data sources.
 */

// Ports (Interfaces)
export type { IAccountRepository } from '@dailyuse/domain-server/account';

// Prisma Adapters
export { AccountPrismaRepository } from './adapters/prisma/account-prisma.repository';

// SQLite Adapters
export { SqliteAccountRepository } from './adapters/sqlite/account-sqlite.repository';

// Memory Adapters
export { AccountMemoryRepository } from './adapters/memory/account-memory.repository';

// DI Container and Factory
export { AccountContainer } from './di/account-container';
export { AccountRepositoryFactory, AccountStatusRepositoryFactory } from './di/account-repository.factory';
