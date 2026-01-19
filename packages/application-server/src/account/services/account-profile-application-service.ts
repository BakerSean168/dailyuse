/**
 * Account Profile Application Service
 * 账户资料管理应用服务
 *
 * 职责（遵循 DDD 最佳实践）：
 * - 账户资料更新（displayName, avatarUrl, bio, timezone, language）
 * - 调用 DomainService 进行业务规则验证
 * - 负责持久化操作
 * - 发布领域事件
 *
 * 架构说明：
 * - DomainService：纯领域逻辑，业务规则验证（无副作用）
 * - ApplicationService：编排层，负责持久化、事务管理、事件发布
 * - Repository：数据访问层，接收事务上下文 tx（待更新）
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

const logger = createLogger('AccountProfileApplicationService');

/**
 * 更新资料请求接口
 */
export interface UpdateProfileRequest {
  accountUuid: string;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  timezone?: string;
  language?: string;
}

/**
 * 更新资料响应接口
 */
export interface UpdateProfileResponse {
  success: boolean;
  account: AccountClientDTO;
  message: string;
}

/**
 * Account Profile Application Service
 * 负责账户资料管理的核心业务逻辑编排
 */
export class AccountProfileApplicationService {
  private static instance: AccountProfileApplicationService;

  private accountRepository: IAccountRepository;
  private accountDomainService: AccountDomainService;

  private constructor(accountRepository: IAccountRepository) {
    this.accountRepository = accountRepository;
    this.accountDomainService = new AccountDomainService();
  }

  /**
   * 创建应用服务实例（支持依赖注入）
   */
  static async createInstance(
    accountRepository?: IAccountRepository,
  ): Promise<AccountProfileApplicationService> {
    const accountContainer = AccountContainer.getInstance();
    const accountRepo = accountRepository || accountContainer.getAccountRepository();

    AccountProfileApplicationService.instance = new AccountProfileApplicationService(accountRepo);
    return AccountProfileApplicationService.instance;
  }

  /**
   * 获取应用服务单例
   */
  static async getInstance(): Promise<AccountProfileApplicationService> {
    if (!AccountProfileApplicationService.instance) {
      AccountProfileApplicationService.instance =
        await AccountProfileApplicationService.createInstance();
    }
    return AccountProfileApplicationService.instance;
  }

  /**
   * 获取账户资料
   *
   * @param accountUuid 账户UUID
   * @returns 账户客户端DTO
   */
  async getProfile(accountUuid: string): Promise<AccountClientDTO> {
    logger.info('[AccountProfileApplicationService] Getting profile', {
      accountUuid,
    });

    try {
      // ===== 步骤 1: 查询账户 =====
      const account = await this.accountRepository.findById(accountUuid);
      if (!account) {
        throw new Error(`Account not found: ${accountUuid}`);
      }

      logger.info('[AccountProfileApplicationService] Profile retrieved successfully', {
        accountUuid: account.uuid,
      });

      // ===== 步骤 2: 返回 AccountClientDTO =====
      return account.toClientDTO();
    } catch (error) {
      logger.error('[AccountProfileApplicationService] Get profile failed', {
        accountUuid,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * 更新账户资料主流程
   *
   * 步骤：
   * 1. 查询账户（ApplicationService 负责）
   * 2. 调用 DomainService 验证业务规则
   * 3. 修改聚合根
   * 4. 持久化（ApplicationService 负责）
   * 5. 发布领域事件
   * 6. 返回 AccountClientDTO
   */
  async updateProfile(request: UpdateProfileRequest): Promise<UpdateProfileResponse> {
    logger.info('[AccountProfileApplicationService] Starting profile update', {
      accountUuid: request.accountUuid,
    });

    try {
      // ===== 步骤 1: 查询账户 =====
      const account = await this.accountRepository.findById(request.accountUuid);
      if (!account) {
        throw new Error(`Account not found: ${request.accountUuid}`);
      }

      // ===== 步骤 2: DomainService 验证业务规则 =====
      this.accountDomainService.validateProfileUpdate(account, {
        displayName: request.displayName,
        avatarUrl: request.avatarUrl,
        bio: request.bio,
        timezone: request.timezone,
        language: request.language,
      });

      // ===== 步骤 3: 修改聚合根 =====
      account.updateProfile({
        displayName: request.displayName,
        avatar: request.avatarUrl,
        bio: request.bio,
        timezone: request.timezone,
        language: request.language,
      });

      logger.debug('[AccountProfileApplicationService] Profile updated in aggregate', {
        accountUuid: account.uuid,
      });

      // ===== 步骤 4: 持久化 =====
      await this.accountRepository.save(account);

      logger.info('[AccountProfileApplicationService] Profile persisted successfully', {
        accountUuid: account.uuid,
      });

      // ===== 步骤 5: 发布领域事件 =====
      await this.publishDomainEvents(account);

      // ===== 步骤 6: 返回 AccountClientDTO =====
      const accountClientDTO = account.toClientDTO();

      return {
        success: true,
        account: accountClientDTO,
        message: 'Profile updated successfully',
      };
    } catch (error) {
      logger.error('[AccountProfileApplicationService] Profile update failed', {
        accountUuid: request.accountUuid,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * 发布领域事件
   */
  private async publishDomainEvents(account: Account): Promise<void> {
    eventBus.publish({
      eventType: 'account:profile_updated',
      payload: {
        accountUuid: account.uuid,
        username: account.username,
        displayName: account.profile?.displayName,
        avatarUrl: account.profile?.avatar,
      },
      timestamp: Date.now(),
      aggregateId: account.uuid,
      occurredOn: new Date(),
    });

    logger.debug('[AccountProfileApplicationService] Domain events published', {
      accountUuid: account.uuid,
    });
  }
}
