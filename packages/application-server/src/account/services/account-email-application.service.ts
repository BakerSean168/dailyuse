/**
 * Account Email Application Service
 * 账户邮箱管理应用服务，处理邮箱变更和验证流程
 */

import type { AccountClientDTO } from '@dailyuse/contracts/account';
import type { IAccountRepository, Account } from '@dailyuse/domain-server/account';
import { AccountDomainService } from '@dailyuse/domain-server/account';
import { AccountContainer } from '@dailyuse/infrastructure-server';
import { eventBus, createLogger } from '@dailyuse/utils';

const logger = createLogger('AccountEmailApplicationService');

export interface UpdateEmailRequest {
  accountUuid: string;
  newEmail: string;
}

export interface VerifyEmailRequest {
  accountUuid: string;
}

export interface AccountResponse {
  success: boolean;
  account: AccountClientDTO;
  message: string;
}

export class AccountEmailApplicationService {
  private static instance: AccountEmailApplicationService;
  private accountRepository: IAccountRepository;
  private accountDomainService: AccountDomainService;

  private constructor(accountRepository: IAccountRepository) {
    this.accountRepository = accountRepository;
    this.accountDomainService = new AccountDomainService();
  }

  static async createInstance(
    accountRepository?: IAccountRepository,
  ): Promise<AccountEmailApplicationService> {
    const accountContainer = AccountContainer.getInstance();
    const accountRepo = accountRepository || accountContainer.getAccountRepository();
    AccountEmailApplicationService.instance = new AccountEmailApplicationService(accountRepo);
    return AccountEmailApplicationService.instance;
  }

  static async getInstance(): Promise<AccountEmailApplicationService> {
    if (!AccountEmailApplicationService.instance) {
      AccountEmailApplicationService.instance =
        await AccountEmailApplicationService.createInstance();
    }
    return AccountEmailApplicationService.instance;
  }

  async updateEmail(request: UpdateEmailRequest): Promise<AccountResponse> {
    logger.info('[AccountEmailApplicationService] Starting email update', {
      accountUuid: request.accountUuid,
      newEmail: request.newEmail,
    });

    try {
      const account = await this.accountRepository.findById(request.accountUuid);
      if (!account) {
        throw new Error(`Account not found: ${request.accountUuid}`);
      }

      await this.checkEmailUniqueness(request.newEmail);
      this.accountDomainService.validateEmailUpdate(account, request.newEmail);

      account.updateEmail(request.newEmail);
      await this.accountRepository.save(account);

      logger.info('[AccountEmailApplicationService] Email persisted successfully', {
        accountUuid: account.uuid,
      });

      await this.publishEmailUpdatedEvent(account);

      return {
        success: true,
        account: account.toClientDTO(),
        message: 'Email updated successfully',
      };
    } catch (error) {
      logger.error('[AccountEmailApplicationService] Email update failed', {
        accountUuid: request.accountUuid,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async verifyEmail(request: VerifyEmailRequest): Promise<AccountResponse> {
    logger.info('[AccountEmailApplicationService] Starting email verification', {
      accountUuid: request.accountUuid,
    });

    try {
      const account = await this.accountRepository.findById(request.accountUuid);
      if (!account) {
        throw new Error(`Account not found: ${request.accountUuid}`);
      }

      account.verifyEmail();
      await this.accountRepository.save(account);

      logger.info('[AccountEmailApplicationService] Email verified successfully', {
        accountUuid: account.uuid,
      });

      await this.publishEmailVerifiedEvent(account);

      return {
        success: true,
        account: account.toClientDTO(),
        message: 'Email verified successfully',
      };
    } catch (error) {
      logger.error('[AccountEmailApplicationService] Email verification failed', {
        accountUuid: request.accountUuid,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  private async checkEmailUniqueness(email: string): Promise<void> {
    const existingAccount = await this.accountRepository.findByEmail(email);
    if (existingAccount) {
      throw new Error(`Email already in use: ${email}`);
    }
  }

  private async publishEmailUpdatedEvent(account: Account): Promise<void> {
    eventBus.publish({
      eventType: 'account:email_updated',
      payload: {
        accountUuid: account.uuid,
        newEmail: account.email,
        timestamp: Date.now(),
      },
    });
  }

  private async publishEmailVerifiedEvent(account: Account): Promise<void> {
    eventBus.publish({
      eventType: 'account:email_verified',
      payload: {
        accountUuid: account.uuid,
        email: account.email,
        timestamp: Date.now(),
      },
    });
  }
}
