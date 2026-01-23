/**
 * Infrastructure Server Bootstrap
 * 
 * Initializes the infrastructure layer with selected data source
 * Supports: Prisma (API) and SQLite (Desktop) implementations
 */

import { DataSourceManager, type DataSourceConfig } from './shared/config/data-source-manager';

/**
 * Initialize infrastructure layer with Prisma (for API)
 * 
 * @example
 * ```typescript
 * import { initializePrismaDataSource } from '@dailyuse/infrastructure-server/bootstrap';
 * 
 * await initializePrismaDataSource();
 * // Now all repositories will use Prisma
 * ```
 */
export async function initializePrismaDataSource(): Promise<void> {
  const { prisma, ensurePrismaConnected } = await import('./shared/config/prisma');
  
  // Ensure Prisma is connected
  await ensurePrismaConnected();
  
  // Initialize DataSourceManager
  DataSourceManager.initialize({
    type: 'prisma',
    prismaClient: prisma,
  });
}

/**
 * Initialize infrastructure layer with SQLite (for Desktop)
 * 
 * @example
 * ```typescript
 * import { initializeSQLiteDataSource } from '@dailyuse/infrastructure-server/bootstrap';
 * import Database from 'better-sqlite3';
 * 
 * const db = new Database('./app.db');
 * await initializeSQLiteDataSource(db);
 * // Now all repositories will use SQLite
 * ```
 */
export async function initializeSQLiteDataSource(sqliteDb: any): Promise<void> {
  DataSourceManager.initialize({
    type: 'sqlite',
    sqliteDb,
  });
}

/**
 * Initialize infrastructure layer with custom config
 */
export function initializeWithConfig(config: DataSourceConfig): void {
  DataSourceManager.initialize(config);
}

/**
 * Get current DataSourceManager instance
 */
export function getDataSourceManager() {
  return DataSourceManager.getInstance();
}
