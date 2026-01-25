/**
 * Account Module - Infrastructure Server
 *
 * Ports and Adapters for Account module persistence.
 * Supports both Prisma (API) and SQLite (Desktop) data sources.
 */

// DI Module
export { AccountModule } from './account.module';

// DI Factory
export { AccountRepositoryFactory } from './di';

// Ports (Interfaces)
export { type IAccountRepository } from '@dailyuse/domain-server/account';

// Prisma Adapters
export { AccountPrismaRepository } from './adapters/prisma';

// SQLite Adapters
export { SqliteAccountRepository } from './adapters/sqlite';