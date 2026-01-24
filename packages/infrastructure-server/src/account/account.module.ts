import {
  AccountApplicationService,
  RegistrationApplicationService,
  AccountProfileApplicationService,
  AccountStatusApplicationService,
  AccountEmailApplicationService,
  AccountDeletionApplicationService,
} from '@dailyuse/application-server/account';
import { AccountPrismaRepository } from './adapters/prisma/account-prisma.repository';
import { AuthCredentialPrismaRepository } from '../authentication/adapters/prisma/auth-credential-prisma.repository';
import { AuthSessionPrismaRepository } from '../authentication/adapters/prisma/auth-session-prisma.repository';
import { PrismaTransactionManager } from '../shared/prisma-transaction-manager';
import type { PrismaClient } from '@prisma/client';

export class AccountModule {
  public readonly accountApplicationService: AccountApplicationService;
  public readonly registrationService: RegistrationApplicationService;
  public readonly profileService: AccountProfileApplicationService;
  public readonly statusService: AccountStatusApplicationService;
  public readonly emailService: AccountEmailApplicationService;
  public readonly deletionService: AccountDeletionApplicationService;

  constructor(prisma: PrismaClient) {
    const accountRepository = new AccountPrismaRepository(prisma);
    const credentialRepository = new AuthCredentialPrismaRepository(prisma);
    const sessionRepository = new AuthSessionPrismaRepository(prisma);
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
