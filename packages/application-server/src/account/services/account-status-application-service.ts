/**
 * Account Status Application Service
 * 账户状态管理应用服务
 *
 * 职责（遵循 DDD 最佳实践）：
 * - 记录登录
 * - 停用账户
 * - 删除账户（软删除）
 * - 调用 DomainService 进行业务规则验证
 * - 负责持久化操作
 * - 发布领域事件
 *
 * 架构说明：
 * - DomainService：纯领域逻辑，业务规则验证（无副作用）
 * - ApplicationService：编排层，负责持久化、事件发布
 * - Repository：数据访问层
 */

import type {
  AccountClientDTO,
} from '@dailyuse/contracts/account';
import type { IAccountRepository, Account } from '@dailyuse/domain-server/account';
import { AccountDomainService } from '@dailyuse/domain-server/account';
import { eventBus, createLogger } from '@dailyuse/utils';

const logger = createLogger('AccountStatusApplicationService');

/**
 * 记录登录请求接口
 */
export interface RecordLoginRequest {
  accountUuid: string;
}

/**
 * 停用账户请求接口
 */
export interface DeactivateAccountRequest {
  accountUuid: string;
}

/**
 * 删除账户请求接口
 */
export interface DeleteAccountRequest {
  accountUuid: string;
}

/**
 * 响应接口
 */
export interface AccountResponse {
  success: boolean;
  account?: AccountClientDTO;
  message: string;
}

/**
 * Account Status Application Service
 * 负责账户状态管理的核心业务逻辑编排
 */
export class AccountStatusApplicationService {
  private accountRepository: IAccountRepository;
  private accountDomainService: AccountDomainService;

  constructor(accountRepository: IAccountRepository) {
    this.accountRepository = accountRepository;
    this.accountDomainService = new AccountDomainService();
  }

  /**
   * 记录登录主流程
   */
  async recordLogin(request: RecordLoginRequest): Promise<AccountResponse> {
    logger.info('[AccountStatusApplicationService] Recording login', {
      accountUuid: request.accountUuid,
    });

    try {
      // ===== 步骤 1: 查询账户 =====
      const account = await this.accountRepository.findById(request.accountUuid);
      if (!account) {
        throw new Error(`Account not found: ${request.accountUuid}`);
      }

      // ===== 步骤 2: 调用聚合根方法记录登录 =====
      account.recordLogin();

      logger.debug('[AccountStatusApplicationService] Login recorded in aggregate', {
        accountUuid: account.uuid,
      });

      // ===== 步骤 3: 持久化 =====
      await this.accountRepository.save(account);

      logger.info('[AccountStatusApplicationService] Login persisted successfully', {
        accountUuid: account.uuid,
      });

      // ===== 步骤 4: 发布领域事件 =====
      await this.publishLoginRecordedEvent(account);

      // ===== 步骤 5: 返回 AccountClientDTO =====
      const accountClientDTO = account.toClientDTO();

      return {
        success: true,
        account: accountClientDTO,
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

  /**
   * 停用账户主流程
   */
  async deactivateAccount(request: DeactivateAccountRequest): Promise<AccountResponse> {
    logger.info('[AccountStatusApplicationService] Deactivating account', {
      accountUuid: request.accountUuid,
    });

    try {
      // ===== 步骤 1: 查询账户 =====
      const account = await this.accountRepository.findById(request.accountUuid);
      if (!account) {
        throw new Error(`Account not found: ${request.accountUuid}`);
      }

      // ===== 步骤 2: 调用聚合根方法停用账户 =====
      account.deactivate();

      logger.debug('[AccountStatusApplicationService] Account deactivated in aggregate', {
        accountUuid: account.uuid,
      });

      // ===== 步骤 3: 持久化 =====
      await this.accountRepository.save(account);

      logger.info('[AccountStatusApplicationService] Account deactivation persisted successfully', {
        accountUuid: account.uuid,
      });

      // ===== 步骤 4: 发布领域事件 =====
      await this.publishAccountDeactivatedEvent(account);

      // ===== 步骤 5: 返回 AccountClientDTO =====
      const accountClientDTO = account.toClientDTO();

      return {
        success: true,
        account: accountClientDTO,
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

  /**
   * 删除账户主流程（软删除）
   */
  async deleteAccount(request: DeleteAccountRequest): Promise<AccountResponse> {
    logger.info('[AccountStatusApplicationService] Deleting account', {
      accountUuid: request.accountUuid,
    });

    try {
      // ===== 步骤 1: 查询账户 =====
      const account = await this.accountRepository.findById(request.accountUuid);
      if (!account) {
        throw new Error(`Account not found: ${request.accountUuid}`);
      }

      // ===== 步骤 2: 验证是否可以删除 =====
      const canDelete = this.accountDomainService.canDeleteAccount(account);
      if (!canDelete) {
        throw new Error('Account cannot be deleted (already deleted)');
      }

      // ===== 步骤 3: 调用聚合根方法软删除 =====
      account.softDelete();

      logger.debug('[AccountStatusApplicationService] Account soft deleted in aggregate', {
        accountUuid: account.uuid,
      });

      // ===== 步骤 4: 持久化 =====
      await this.accountRepository.save(account);

      logger.info('[AccountStatusApplicationService] Account deletion persisted successfully', {
        accountUuid: account.uuid,
      });

      // ===== 步骤 5: 发布领域事件 =====
      await this.publishAccountDeletedEvent(account);

      return {
        success: true,
        message: 'Account deleted successfully',
      };
    } catch (error) {
      logger.error('[AccountStatusApplicationService] Account deletion failed', {
        accountUuid: request.accountUuid,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * 发布登录记录事件
   */
  private async publishLoginRecordedEvent(account: Account): Promise<void> {
    eventBus.publish({
      eventType: 'account:login_recorded',
      payload: {
        accountUuid: account.uuid,
        username: account.username,
        lastLoginAt: Date.now(), // 使用当前时间
      },
      timestamp: Date.now(),
      aggregateId: account.uuid,
      occurredOn: new Date(),
    });

    logger.debug('[AccountStatusApplicationService] Login recorded event published', {
      accountUuid: account.uuid,
    });
  }

  /**
   * 发布账户停用事件
   */
  private async publishAccountDeactivatedEvent(account: Account): Promise<void> {
    eventBus.publish({
      eventType: 'account:deactivated',
      payload: {
        accountUuid: account.uuid,
        username: account.username,
        status: account.status,
      },
      timestamp: Date.now(),
      aggregateId: account.uuid,
      occurredOn: new Date(),
    });

    logger.debug('[AccountStatusApplicationService] Account deactivated event published', {
      accountUuid: account.uuid,
    });
  }

  /**
   * 发布账户删除事件
   */
  private async publishAccountDeletedEvent(account: Account): Promise<void> {
    eventBus.publish({
      eventType: 'account:deleted',
      payload: {
        accountUuid: account.uuid,
        username: account.username,
        status: account.status,
      },
      timestamp: Date.now(),
      aggregateId: account.uuid,
      occurredOn: new Date(),
    });

    logger.debug('[AccountStatusApplicationService] Account deleted event published', {
      accountUuid: account.uuid,
    });
  }
}
