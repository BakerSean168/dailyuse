/**
 * Database Repository Factory
 * 
 * Central factory for creating repository containers with different data sources.
 * Supports both Prisma (PostgreSQL for API) and SQLite (better-sqlite3 for Desktop).
 */

import { PrismaClient } from '../generated/prisma/client';
import type Database from 'better-sqlite3';

/**
 * Data source type
 */
export type DataSource = 'prisma' | 'sqlite';

/**
 * Database client type union
 */
export type DatabaseClient = PrismaClient | Database.Database;

/**
 * Factory configuration
 */
export interface FactoryConfig {
  dataSource: DataSource;
  client: DatabaseClient;
}

/**
 * Repository Factory
 * 
 * This is the main entry point for creating repository containers.
 * Applications should use this factory to create their repositories.
 * 
 * @example
 * ```typescript
 * // API Server (Prisma)
 * const prisma = new PrismaClient();
 * const goalRepos = RepositoryFactory.createGoalRepositories('prisma', prisma);
 * 
 * // Desktop App (SQLite)
 * const db = new Database('app.db');
 * const goalRepos = RepositoryFactory.createGoalRepositories('sqlite', db);
 * ```
 */
export class RepositoryFactory {
  /**
   * Create all repositories for a given data source
   */
  static createAll(config: FactoryConfig) {
    const { dataSource, client } = config;

    return {
      // Module repositories will be added here
      // goal: this.createGoalRepositories(dataSource, client),
      // task: this.createTaskRepositories(dataSource, client),
      // ...
    };
  }

  /**
   * Utility: Check if client is Prisma
   */
  static isPrismaClient(client: DatabaseClient): client is PrismaClient {
    return 'goal' in client; // Prisma has model accessors
  }

  /**
   * Utility: Check if client is SQLite
   */
  static isSqliteClient(client: DatabaseClient): client is Database.Database {
    return 'prepare' in client; // SQLite has prepare method
  }
}

/**
 * Re-export module-specific factories
 */
export { GoalRepositoryFactory, type IGoalRepositoryContainer } from '../goal/di/repository-factory';
