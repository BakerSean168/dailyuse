/**
 * @file AccountEmailApplicationService.ts
 * @description 账户邮箱管理应用服务，处理邮箱变更和验证流程。
 * @date 2025-01-22
 */

import type {
  AccountServerDTO,
  AccountClientDTO,
  CreateAccountRequest,
} from '@dailyuse/contracts/account';
import type { IAccountRepository, Account } from '@dailyuse/domain-server/account';
import { AccountDomainService } from '@dailyuse/domain-server/account';
import { AccountContainer } from '@dailyuse/infrastructure-server';
import { prisma } from '@/shared/infrastructure/config/prisma';
import { eventBus, createLogger } from '@dailyuse/utils';

const logger = createLogger('AccountEmailApplicationService');

/**
 * 更新邮箱请求接口。
 */
export interface UpdateEmailRequest {
  /** 账户 UUID */
  accountUuid: string;
  /** 新邮箱地址 */
  newEmail: string;
}

/**
 * 验证邮箱请求接口。
 */
export interface VerifyEmailRequest {
  /** 账户 UUID */
  accountUuid: string;
}

/**
 * 账户操作响应接口。
 */
export interface AccountResponse {
  /** 操作是否成功 */
  success: boolean;
  /** 返回的账户数据 */
  account: AccountClientDTO;
  /** 结果消息 */
  message: string;
}

/**
 * 账户邮箱应用服务。
 *
 * @remarks
 * 负责处理用户邮箱的变更和验证逻辑，包括：
 * - 更新邮箱地址
 * - 验证邮箱
 * - 检查邮箱唯一性
 * - 协调 DomainService 和 Repository
 * - 发布相关领域事件
 */
export class AccountEmailApplicationService {
  private static instance: AccountEmailApplicationService;

  private accountRepository: IAccountRepository;
  private accountDomainService: AccountDomainService;

  private constructor(accountRepository: IAccountRepository) {
    this.accountRepository = accountRepository;
    this.accountDomainService = new AccountDomainService();
  }

  /**
   * 创建应用服务实例（支持依赖注入）。
   *
   * @param accountRepository - 可选的仓储实例
   * @returns {Promise<AccountEmailApplicationService>} 服务实例
   */
  static async createInstance(
    accountRepository?: IAccountRepository,
  ): Promise<AccountEmailApplicationService> {
    const accountContainer = AccountContainer.getInstance();
    const accountRepo = accountRepository || accountContainer.getAccountRepository();

    AccountEmailApplicationService.instance = new AccountEmailApplicationService(accountRepo);
    return AccountEmailApplicationService.instance;
  }

  /**
   * 获取应用服务单例。
   *
   * @returns {Promise<AccountEmailApplicationService>} 单例实例
   */
  static async getInstance(): Promise<AccountEmailApplicationService> {
    if (!AccountEmailApplicationService.instance) {
      AccountEmailApplicationService.instance =
        await AccountEmailApplicationService.createInstance();
    }
    return AccountEmailApplicationService.instance;
  }

  /**
   * 更新邮箱地址主流程。
   *
   * @remarks
   * 执行步骤：
   * 1. 查询账户。
   * 2. 检查新邮箱是否已存在。
   * 3. 调用 DomainService 验证业务规则。
   * 4. 更新聚合根状态。
   * 5. 持久化。
   * 6. 发布 `account:email_updated` 事件。
   *
   * @param request - 更新请求数据
   * @returns {Promise<AccountResponse>} 操作结果
   * @throws {Error} 当账户不存在、邮箱已占用或验证失败时抛出
   */
  async updateEmail(request: UpdateEmailRequest): Promise<AccountResponse> {
    logger.info('[AccountEmailApplicationService] Starting email update', {
      accountUuid: request.accountUuid,
      newEmail: request.newEmail,
    });

    try {
      // ===== 步骤 1: 查询账户 =====
      const account = await this.accountRepository.findById(request.accountUuid);
      if (!account) {
        throw new Error(`Account not found: ${request.accountUuid}`);
      }

      // ===== 步骤 2: 检查新邮箱唯一性 =====
      await this.checkEmailUniqueness(request.newEmail);

      // ===== 步骤 3: DomainService 验证业务规则 =====
      this.accountDomainService.validateEmailUpdate(account, request.newEmail);

      // ===== 步骤 4: 修改聚合根 =====
      account.updateEmail(request.newEmail);

      logger.debug('[AccountEmailApplicationService] Email updated in aggregate', {
        accountUuid: account.uuid,
        newEmail: request.newEmail,
      });

      // ===== 步骤 5: 持久化 =====
      await this.accountRepository.save(account);

      logger.info('[AccountEmailApplicationService] Email persisted successfully', {
        accountUuid: account.uuid,
      });

      // ===== 步骤 6: 发布领域事件 =====
      await this.publishEmailUpdatedEvent(account);

      // ===== 步骤 7: 返回 AccountClientDTO =====
      const accountClientDTO = account.toClientDTO();

      return {
        success: true,
        account: accountClientDTO,
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

  /**
   * 验证邮箱主流程。
   *
   * @remarks
   * 执行步骤：
   * 1. 查询账户。
   * 2. 调用聚合根 `verifyEmail()` 方法。
   * 3. 持久化。
   * 4. 发布 `account:email_verified` 事件。
   *
   * @param request - 验证请求数据
   * @returns {Promise<AccountResponse>} 操作结果
   * @throws {Error} 当账户不存在或操作失败时抛出
   */
  async verifyEmail(request: VerifyEmailRequest): Promise<AccountResponse> {
    logger.info('[AccountEmailApplicationService] Starting email verification', {
      accountUuid: request.accountUuid,
    });

    try {
      // ===== 步骤 1: 查询账户 =====
      const account = await this.accountRepository.findById(request.accountUuid);
      if (!account) {
        throw new Error(`Account not found: ${request.accountUuid}`);
      }

      // ===== 步骤 2: 调用聚合根方法验证邮箱 =====
      account.verifyEmail();

      logger.debug('[AccountEmailApplicationService] Email verified in aggregate', {
        accountUuid: account.uuid,
      });

      // ===== 步骤 3: 持久化 =====
      await this.accountRepository.save(account);

      logger.info('[AccountEmailApplicationService] Email verification persisted successfully', {
        accountUuid: account.uuid,
      });

      // ===== 步骤 4: 发布领域事件 =====
      await this.publishEmailVerifiedEvent(account);

      // ===== 步骤 5: 返回 AccountClientDTO =====
      const accountClientDTO = account.toClientDTO();

      return {
        success: true,
        account: accountClientDTO,
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

  /**
   * 检查邮箱唯一性。
   *
   * @param email - 待检查的邮箱
   * @returns {Promise<void>}
   * @throws {Error} 当邮箱已存在时抛出
   */
  private async checkEmailUniqueness(email: string): Promise<void> {
    const existingAccount = await this.accountRepository.findByEmail(email);
    if (existingAccount) {
      throw new Error(`Email already exists: ${email}`);
    }
  }

  /**
   * 发布邮箱更新事件。
   *
   * @param account - 相关账户实体
   * @returns {Promise<void>}
   */
  private async publishEmailUpdatedEvent(account: Account): Promise<void> {
    eventBus.publish({
      eventType: 'account:email_updated',
      payload: {
        accountUuid: account.uuid,
        username: account.username,
        newEmail: account.email,
        emailVerified: account.emailVerified,
      },
      timestamp: Date.now(),
      aggregateId: account.uuid,
      occurredOn: new Date(),
    });

    logger.debug('[AccountEmailApplicationService] Email updated event published', {
      accountUuid: account.uuid,
    });
  }

  /**
   * 发布邮箱验证事件。
   *
   * @param account - 相关账户实体
   * @returns {Promise<void>}
   */
  private async publishEmailVerifiedEvent(account: Account): Promise<void> {
    eventBus.publish({
      eventType: 'account:email_verified',
      payload: {
        accountUuid: account.uuid,
        username: account.username,
        email: account.email,
      },
      timestamp: Date.now(),
      aggregateId: account.uuid,
      occurredOn: new Date(),
    });

    logger.debug('[AccountEmailApplicationService] Email verified event published', {
      accountUuid: account.uuid,
    });
  }
}
