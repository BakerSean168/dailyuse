/**
 * Account Status Application Service
 * 账户状态管理应用服务
 */

import type { AccountClientDTO } from '@dailyuse/contracts/account';
import type { IAccountRepository, Account } from '@dailyuse/domain-server/account';
import { AccountDomainService } from '@dailyuse/domain-server/account';
import { AccountContainer } from '@dailyuse/infrastructure-server';
import { eventBus, createLogger } from '@dailyuse/utils';

const logger = createLogger('AccountStatusApplicationService');

export interface RecordLoginRequest {
  accountUuid: string;
}

export interface DeactivateAccountRequest {
  accountUuid: string;
}

export interface AccountResponse {
  success: boolean;
  account?: AccountClientDTO;
  message: string;
}

export class AccountStatusApplicationService {
  private static instance: AccountStatusApplicationService;
  private accountRepository: IAccountRepository;
  private accountDomainService: AccountDomainService;

  private constructor(accountRepository: IAccountRepository) {
    this.accountRepository = accountRepository;
    this.accountDomainService = new AccountDomainService();
  }

  static async createInstance(
    accountRepository?: IAccountRepository,
  ): Promise<AccountStatusApplicationService> {
    const accountContainer = AccountContainer.getInstance();
    const accountRepo = accountRepository || accountContainer.getAccountRepository();
    AccountStatusApplicationService.instance = new AccountStatusApplicationService(accountRepo);
    return AccountStatusApplicationService.instance;
  }

  static async getInstance(): Promise<AccountStatusApplicationService> {
    if (!AccountStatusApplicationService.instance) {
      AccountStatusApplicationService.instance =
        await AccountStatusApplicationService.createInstance();
    }
    return AccountStatusApplicationService.instance;
  }

  async recordLogin(request: RecordLoginRequest): Promise<AccountResponse> {
    logger.info('[AccountStatusApplicationService] Recording login', {
      accountUuid: request.accountUuid,
    });

    try {
      const account = await this.accountRepository.findById(request.accountUuid);
      if (!account) {
        throw new Error(`Account not found: ${request.accountUuid}`);
      }

      account.recordLogin();
      await this.accountRepository.save(account);

      logger.info('[AccountStatusApplicationService] Login persisted successfully', {
        accountUuid: account.uuid,
      });

      await this.publishLoginRecordedEvent(account);

      return {
        success: true,
        account: account.toClientDTO(),
        message: 'Login recorded successfully',
      };
    } catch (error) {
      logger.error('[AccountStatusApplicationService] Login recording failed', {
        accountUuid: request.accountUuid,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async deactivateAccount(request: DeactivateAccountRequest): Promise<AccountResponse> {
    logger.info('[AccountStatusApplicationService] Deactivating account', {
      accountUuid: request.accountUuid,
    });

    try {
      const account = await this.accountRepository.findById(request.accountUuid);
      if (!account) {
        throw new Error(`Account not found: ${request.accountUuid}`);
      }

      account.deactivate();
      await this.accountRepository.save(account);

      logger.info('[AccountStatusApplicationService] Account deactivation persisted successfully', {
        accountUuid: account.uuid,
      });

      await this.publishAccountDeactivatedEvent(account);

      return {
        success: true,
        account: account.toClientDTO(),
        message: 'Account deactivated successfully',
      };
    } catch (error) {
      logger.error('[AccountStatusApplicationService] Account deactivation failed', {
        accountUuid: request.accountUuid,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  private async publishLoginRecordedEvent(account: Account): Promise<void> {
    eventBus.publish({
      eventType: 'account:login_recorded',
      payload: {
        accountUuid: account.uuid,
        timestamp: Date.now(),
      },
    });
  }

  private async publishAccountDeactivatedEvent(account: Account): Promise<void> {
    eventBus.publish({
      eventType: 'account:deactivated',
      payload: {
        accountUuid: account.uuid,
        username: account.username,
        timestamp: Date.now(),
      },
    });
  }
}
