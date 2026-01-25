/**
 * Account Repository Factory
 * Provides repository implementations for different data sources
 * 
 * Note: Account module also depends on Authentication repositories
 * (AuthCredential, AuthSession) and TransactionManager
 */

import type { PrismaClient } from '@prisma/client';
import type Database from 'better-sqlite3';

import { AccountPrismaRepository } from '../adapters/prisma';
import { SqliteAccountRepository } from '../adapters/sqlite';
import {
  AuthCredentialPrismaRepository,
  AuthSessionPrismaRepository,
} from '../../authentication/adapters/prisma/index';
import {
  SqliteAuthCredentialRepository,
  SqliteAuthSessionRepository,
} from '../../authentication/adapters/sqlite/index';
import { PrismaTransactionManager } from '../../shared/prisma-transaction-manager';
import { SqliteTransactionManager } from '../../shared/sqlite-transaction-manager';

type BetterSQLiteDB = Database.Database;

/**
 * Account Repository Factory
 */
export class AccountRepositoryFactory {
  /**
   * Create repositories using Prisma (for API/PostgreSQL)
   */
  static createPrismaRepositories(prisma: PrismaClient) {
    return {
      accountRepository: new AccountPrismaRepository(prisma),
      credentialRepository: new AuthCredentialPrismaRepository(prisma),
      sessionRepository: new AuthSessionPrismaRepository(prisma),
      transactionManager: new PrismaTransactionManager(prisma),
    };
  }

  /**
   * Create repositories using SQLite (for Desktop/better-sqlite3)
   */
  static createSqliteRepositories(db: BetterSQLiteDB) {
    return {
      accountRepository: new SqliteAccountRepository(db),
      credentialRepository: new SqliteAuthCredentialRepository(db),
      sessionRepository: new SqliteAuthSessionRepository(db),
      transactionManager: new SqliteTransactionManager(db),
    };
  }

  /**
   * Create repositories based on data source type
   */
  static create(
    dataSource: 'prisma' | 'sqlite',
    client: PrismaClient | BetterSQLiteDB,
  ): ReturnType<typeof AccountRepositoryFactory.createPrismaRepositories> {
    if (dataSource === 'prisma') {
      return this.createPrismaRepositories(client as PrismaClient) as any;
    } else {
      return this.createSqliteRepositories(client as BetterSQLiteDB) as any;
    }
  }

  /**
   * Legacy methods for backward compatibility
   * @deprecated Use create() instead
   */
  static createForPrisma(prismaClient: any) {
    return new AccountPrismaRepository(prismaClient);
  }

  /**
   * Legacy methods for backward compatibility
   * @deprecated Use create() instead
   */
  static createForSQLite(sqliteDb: any) {
    return new SqliteAccountRepository(sqliteDb);
  }
}


