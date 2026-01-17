/**
 * Account Profile Application Service
 * 账户资料管理应用服务
 *
 * 职责（遵循 DDD 最佳实践）：
 * - 账户资料更新（displayName, avatarUrl, bio, timezone, language）
 * - 调用 DomainService 进行业务规则验证
 * - 负责持久化操作
 * - 发布领域事件
 */

import type { AccountClientDTO } from '@dailyuse/contracts/account';
import type { IAccountRepository, Account } from '@dailyuse/domain-server/account';
import { AccountDomainService } from '@dailyuse/domain-server/account';
import { AccountContainer } from '@dailyuse/infrastructure-server';
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
      const account = await this.accountRepository.findById(accountUuid);
      if (!account) {
        throw new Error(`Account not found: ${accountUuid}`);
      }

      logger.info('[AccountProfileApplicationService] Profile retrieved successfully', {
        accountUuid: account.uuid,
      });

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
   */
  async updateProfile(request: UpdateProfileRequest): Promise<UpdateProfileResponse> {
    logger.info('[AccountProfileApplicationService] Starting profile update', {
      accountUuid: request.accountUuid,
    });

    try {
      const account = await this.accountRepository.findById(request.accountUuid);
      if (!account) {
        throw new Error(`Account not found: ${request.accountUuid}`);
      }

      this.accountDomainService.validateProfileUpdate(account, {
        displayName: request.displayName,
        avatarUrl: request.avatarUrl,
        bio: request.bio,
        timezone: request.timezone,
        language: request.language,
      });

      account.updateProfile({
        displayName: request.displayName,
        avatar: request.avatarUrl,
        bio: request.bio,
        timezone: request.timezone,
        language: request.language,
      });

      await this.accountRepository.save(account);

      logger.info('[AccountProfileApplicationService] Profile persisted successfully', {
        accountUuid: account.uuid,
      });

      await this.publishDomainEvents(account);

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
        timestamp: Date.now(),
      },
    });
  }
}
