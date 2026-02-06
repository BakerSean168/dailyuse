import type { PrismaClient } from '../generated/prisma/client';
import type Database from 'better-sqlite3';

import {
  AccountApplicationService,
  RegistrationApplicationService,
  AccountProfileApplicationService,
  AccountStatusApplicationService,
  AccountEmailApplicationService,
  AccountDeletionApplicationService,
} from '@dailyuse/application-server/account';
import { AccountRepositoryFactory } from './di';

type BetterSQLiteDB = Database.Database;

type AccountRepositories = ReturnType<
  typeof AccountRepositoryFactory.createPrismaRepositories
>;

export class AccountModule {
  public readonly accountApplicationService: AccountApplicationService;
  public readonly registrationService: RegistrationApplicationService;
  public readonly profileService: AccountProfileApplicationService;
  public readonly statusService: AccountStatusApplicationService;
  public readonly emailService: AccountEmailApplicationService;
  public readonly deletionService: AccountDeletionApplicationService;

  constructor(
    dataSourceType: 'prisma' | 'sqlite',
    dbConnection: PrismaClient | BetterSQLiteDB,
  ) {
    // 1. Initialize Repositories using Factory
    const repositories = AccountRepositoryFactory.create(dataSourceType, dbConnection);
    const accountRepository = repositories.accountRepository;
    const credentialRepository = repositories.credentialRepository;
    const sessionRepository = repositories.sessionRepository;
    const transactionManager = repositories.transactionManager;

    // 2. Initialize Services
    this.registrationService = new RegistrationApplicationService(
      accountRepository,
      credentialRepository,
      transactionManager,
    );

    this.profileService = new AccountProfileApplicationService(accountRepository);

    this.statusService = new AccountStatusApplicationService(accountRepository);

    this.emailService = new AccountEmailApplicationService(accountRepository);

    this.deletionService = new AccountDeletionApplicationService(
      accountRepository,
      credentialRepository,
      sessionRepository,
      transactionManager,
    );

    this.accountApplicationService = new AccountApplicationService(
      this.registrationService,
      this.profileService,
      this.statusService,
      this.emailService,
      this.deletionService,
    );
  }
}
