/**
 * Account Deletion Application Service
 * 账户注销应用服务，负责账户删除流程编排
 */

import type { IAccountRepository, Account } from '@dailyuse/domain-server/account';
import type {
  IAuthCredentialRepository,
  IAuthSessionRepository,
  AuthCredential,
} from '@dailyuse/domain-server/authentication';
import { AuthenticationDomainService } from '@dailyuse/domain-server/authentication';
import { AccountContainer, AuthContainer } from '@dailyuse/infrastructure-server';
import { eventBus, createLogger } from '@dailyuse/utils';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const logger = createLogger('AccountDeletionApplicationService');

/**
 * 账户注销请求接口
 */
export interface DeleteAccountRequest {
  accountUuid: string;
  password: string;
  reason?: string;
  feedback?: string;
  confirmationText?: string;
}

/**
 * 账户注销响应接口
 */
export interface DeleteAccountResponse {
  success: boolean;
  message: string;
  deletedAt: number;
  accountUuid: string;
}

/**
 * 账户注销应用服务
 */
export class AccountDeletionApplicationService {
  private static instance: AccountDeletionApplicationService;

  private accountRepository: IAccountRepository;
  private credentialRepository: IAuthCredentialRepository;
  private sessionRepository: IAuthSessionRepository;
  private authenticationDomainService: AuthenticationDomainService;
  private prisma: PrismaClient;

  private constructor(
    accountRepository: IAccountRepository,
    credentialRepository: IAuthCredentialRepository,
    sessionRepository: IAuthSessionRepository,
    prisma: PrismaClient,
  ) {
    this.accountRepository = accountRepository;
    this.credentialRepository = credentialRepository;
    this.sessionRepository = sessionRepository;
    this.authenticationDomainService = new AuthenticationDomainService();
    this.prisma = prisma;
  }

  static async createInstance(
    accountRepository?: IAccountRepository,
    credentialRepository?: IAuthCredentialRepository,
    sessionRepository?: IAuthSessionRepository,
    prisma?: PrismaClient,
  ): Promise<AccountDeletionApplicationService> {
    const accountContainer = AccountContainer.getInstance();
    const authContainer = AuthContainer.getInstance();

    const accRepo = accountRepository || accountContainer.getAccountRepository();
    const credRepo = credentialRepository || authContainer.getCredentialRepository();
    const sessRepo = sessionRepository || authContainer.getSessionRepository();
    const prismaClient = prisma || accountContainer.getPrismaClient();

    AccountDeletionApplicationService.instance = new AccountDeletionApplicationService(
      accRepo,
      credRepo,
      sessRepo,
      prismaClient,
    );
    return AccountDeletionApplicationService.instance;
  }

  static async getInstance(): Promise<AccountDeletionApplicationService> {
    if (!AccountDeletionApplicationService.instance) {
      AccountDeletionApplicationService.instance =
        await AccountDeletionApplicationService.createInstance();
    }
    return AccountDeletionApplicationService.instance;
  }

  async deleteAccount(request: DeleteAccountRequest): Promise<DeleteAccountResponse> {
    logger.info('[AccountDeletionApplicationService] Starting account deletion', {
      accountUuid: request.accountUuid,
      reason: request.reason,
    });

    try {
      this.validateInput(request);

      const account = await this.accountRepository.findById(request.accountUuid);
      if (!account) {
        throw new Error('Account not found');
      }

      if (account.status === 'DELETED') {
        throw new Error('Account already deleted');
      }

      const credential = await this.credentialRepository.findByAccountUuid(request.accountUuid);
      if (!credential) {
        throw new Error('Credential not found');
      }

      const hashedPassword = await bcrypt.hash(request.password, 12);
      const isPasswordValid = this.authenticationDomainService.verifyPassword(
        credential,
        hashedPassword,
      );

      if (!isPasswordValid) {
        throw new Error('Invalid password');
      }

      const result = await this.prisma.$transaction(async (tx: any) => {
        account.softDelete();
        await this.accountRepository.save(account, tx);

        credential.revoke();
        await this.credentialRepository.save(credential, tx);

        const activeSessions = await this.sessionRepository.findActiveByAccountUuid(
          request.accountUuid,
        );
        for (const session of activeSessions) {
          session.revoke();
          await this.sessionRepository.save(session, tx);
        }

        logger.info('[AccountDeletionApplicationService] All sessions revoked', {
          accountUuid: account.uuid,
          sessionCount: activeSessions.length,
        });

        return {
          account,
          credential,
          sessionsRevoked: activeSessions.length,
        };
      });

      await this.publishAccountDeletedEvent(result.account, request.reason);

      const deletedAt = Date.now();

      return {
        success: true,
        message: 'Account deleted successfully',
        deletedAt,
        accountUuid: request.accountUuid,
      };
    } catch (error) {
      logger.error('[AccountDeletionApplicationService] Account deletion failed', {
        accountUuid: request.accountUuid,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  private validateInput(request: DeleteAccountRequest): void {
    if (request.confirmationText && request.confirmationText !== 'DELETE') {
      throw new Error('Invalid confirmation text. Must be "DELETE".');
    }

    if (!request.password || request.password.length < 8) {
      throw new Error('Password must be at least 8 characters.');
    }
  }

  private async publishAccountDeletedEvent(account: Account, reason?: string): Promise<void> {
    eventBus.publish({
      eventType: 'account:deleted',
      payload: {
        accountUuid: account.uuid,
        username: account.username,
        reason,
        timestamp: Date.now(),
      },
    });
  }
}
