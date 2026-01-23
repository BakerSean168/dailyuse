import type { IAccountRepository } from '@dailyuse/contracts/account';
import { AccountRepositoryPrisma } from './prisma/account-prisma.repository';
import { SqliteAccountRepository } from './sqlite/account-sqlite.repository';

export class AccountRepositoryFactory {
  static createForPrisma(prismaClient: any): IAccountRepository {
    return new AccountRepositoryPrisma(prismaClient);
  }

  static createForSQLite(sqliteDb: any): IAccountRepository {
    return new SqliteAccountRepository(sqliteDb);
  }
}

