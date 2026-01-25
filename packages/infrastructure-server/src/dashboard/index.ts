/**
 * Dashboard Module - Infrastructure Server
 *
 * Repository implementations and DI Module for Dashboard domain.
 * Supports both Prisma (API) and SQLite (Desktop) data sources.
 */

// ============ DI Module ============
export { DashboardModule } from './dashboard.module';

// ============ Repository Factory ============
export { DashboardRepositoryFactory } from './di/dashboard-repository.factory';

// ============ Adapters - Prisma ============
export { DashboardConfigPrismaRepository } from './adapters/prisma/dashboard-config-prisma.repository';

// ============ Adapters - SQLite ============
export { SqliteDashboardConfigRepository } from './adapters/sqlite/dashboard-config-sqlite.repository';

// ============ Adapters - Memory ============
export { DashboardConfigMemoryRepository } from './adapters/memory/dashboard-config-memory.repository';

// ============ Ports (Interfaces) ============
export { type IDashboardConfigRepository } from './ports/dashboard-config-repository.port';
