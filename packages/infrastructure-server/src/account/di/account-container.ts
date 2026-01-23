import type { IAccountRepository } from '@dailyuse/domain-server/account';
import { DataSourceManager } from '../../shared/config/data-source-manager';
import { AccountRepositoryFactory } from './account-repository.factory';
import { prisma } from '../../shared/config/prisma';

/**
 * Account Module DI Container
 *
 * Manages Account repository instances
 * Supports both Prisma and SQLite data sources
 */
export class AccountContainer {
  private static instance: AccountContainer;
  private accountRepository?: IAccountRepository;

  private constructor() {}

  static getInstance(): AccountContainer {
    if (!AccountContainer.instance) {
      AccountContainer.instance = new AccountContainer();
    }
    return AccountContainer.instance;
  }

  /**
   * Get Account repository (lazy load with caching)
   * Automatically selects Prisma or SQLite based on DataSourceManager
   */
  getAccountRepository(): IAccountRepository {
    if (!this.accountRepository) {
      const dsManager = DataSourceManager.getInstance();

      if (dsManager.isPrisma()) {
        this.accountRepository = AccountRepositoryFactory.createForPrisma(prisma);
      } else if (dsManager.isSQLite()) {
        this.accountRepository = AccountRepositoryFactory.createForSQLite(dsManager.getSQLiteDb());
      } else {
        throw new Error('Unknown data source type');
      }
    }
    return this.accountRepository;
  }

  /**
   * Set Account repository (for testing)
   */
  setAccountRepository(repository: IAccountRepository): void {
    this.accountRepository = repository;
  }

  /**
   * Reset container (for testing)
   */
  reset(): void {
    this.accountRepository = undefined;
  }
}

