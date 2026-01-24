import type { IAccountRepository } from '@dailyuse/domain-server/account';
import { AccountPrismaRepository } from '../adapters/prisma/account-prisma.repository';
import { SqliteAccountRepository } from '../adapters/sqlite/account-sqlite.repository';

/**
 * Account Repository Factory
 *
 * Creates repository instances based on data source type
 * Supports: Prisma (API), SQLite (Desktop)
 */
export class AccountRepositoryFactory {
  static createForPrisma(prismaClient: any): IAccountRepository {
    return new AccountPrismaRepository(prismaClient);
  }

  static createForSQLite(sqliteDb: any): IAccountRepository {
    return new SqliteAccountRepository(sqliteDb);
  }
}

/**
 * Account Status Repository Factory (if needed)
 */
export class AccountStatusRepositoryFactory {
  static createForPrisma(prismaClient: any): any {
    // Implement based on actual Prisma adapter
    throw new Error('AccountStatusRepository Prisma adapter not implemented');
  }

  static createForSQLite(sqliteDb: any): any {
    // Implement based on actual SQLite adapter
    throw new Error('AccountStatusRepository SQLite adapter not implemented');
  }
}

