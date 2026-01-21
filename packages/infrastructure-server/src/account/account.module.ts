import {
  AccountApplicationService,
  RegistrationApplicationService,
  AccountProfileApplicationService,
  AccountStatusApplicationService,
  AccountEmailApplicationService,
  AccountDeletionApplicationService,
} from '@dailyuse/application-server/account';
import { PrismaAccountRepository } from './repositories/prisma-account.repository';
import { PrismaAuthCredentialRepository } from '../authentication/repositories/prisma-auth-credential-repository';
import { PrismaAuthSessionRepository } from '../authentication/repositories/prisma-auth-session-repository';
import { PrismaTransactionManager } from '../shared/prisma-transaction-manager';
import { PrismaClient } from '@prisma/client';

export class AccountModule {
  public readonly accountApplicationService: AccountApplicationService;
  public readonly registrationService: RegistrationApplicationService;
  public readonly profileService: AccountProfileApplicationService;
  public readonly statusService: AccountStatusApplicationService;
  public readonly emailService: AccountEmailApplicationService;
  public readonly deletionService: AccountDeletionApplicationService;

  constructor(prisma: PrismaClient) {
    const accountRepository = new PrismaAccountRepository(prisma);
    const credentialRepository = new PrismaAuthCredentialRepository(prisma);
    const sessionRepository = new PrismaAuthSessionRepository(prisma);
    const transactionManager = new PrismaTransactionManager(prisma);

    this.registrationService = new RegistrationApplicationService(
      accountRepository,
      credentialRepository,
      transactionManager
    );

    this.profileService = new AccountProfileApplicationService(accountRepository);

    this.statusService = new AccountStatusApplicationService(accountRepository);

    this.emailService = new AccountEmailApplicationService(accountRepository);

    this.deletionService = new AccountDeletionApplicationService(
      accountRepository,
      credentialRepository,
      sessionRepository,
      transactionManager
    );

    this.accountApplicationService = new AccountApplicationService(
      this.registrationService,
      this.profileService,
      this.statusService,
      this.emailService,
      this.deletionService
    );
  }
}
