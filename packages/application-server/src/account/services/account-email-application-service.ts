/**
 * @file AccountEmailApplicationService.ts
 * @description 账户邮箱管理应用服务，处理邮箱变更和验证流程。
 * @date 2025-01-22
 */

import type {
  AccountClientDTO,
} from '@dailyuse/contracts/account';
import type { IAccountRepository, Account } from '@dailyuse/domain-server/account';
import { AccountDomainService } from '@dailyuse/domain-server/account';
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
 * 响应接口。
 */
export interface EmailResponse {
  success: boolean;
  message: string;
  account?: AccountClientDTO;
}

/**
 * Account Email Application Service
 */
export class AccountEmailApplicationService {
  private accountRepository: IAccountRepository;
  private accountDomainService: AccountDomainService;

  constructor(accountRepository: IAccountRepository) {
    this.accountRepository = accountRepository;
    this.accountDomainService = new AccountDomainService();
  }

  /**
   * 申请变更邮箱
   * 
   * 通常流程：
   * 1. 验证新邮箱格式和唯一性
   * 2. 生成验证 Token (这里可能是由 DomainService 生成并返回，或者应用层生成)
   * 3. 发送验证邮件
   * 
   * 简化实现：直接更新（假设无需验证，或者验证逻辑在 DomainService）
   */
  async requestEmailChange(request: UpdateEmailRequest): Promise<EmailResponse> {
    logger.info('[AccountEmailApplicationService] Requesting email change', {
      accountUuid: request.accountUuid,
      newEmail: request.newEmail,
    });

    try {
      const account = await this.accountRepository.findById(request.accountUuid);
      if (!account) {
        throw new Error('Account not found');
      }

      // 验证邮箱格式
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(request.newEmail)) {
        throw new Error('Invalid email format');
      }

      // 验证唯一性
      const existing = await this.accountRepository.findByEmail(request.newEmail);
      if (existing) {
        throw new Error('Email is already in use');
      }

      // 更新邮箱
      // 注意：真实场景应该先发送验证邮件，点击链接后再更新
      // 这里简化为直接更新
      account.updateEmail(request.newEmail);
      
      await this.accountRepository.save(account);

      // 发布事件
      eventBus.publish({
        eventType: 'account:email_updated',
        payload: {
          accountUuid: account.uuid,
          newEmail: account.email
        },
        timestamp: Date.now(),
        aggregateId: account.uuid,
        occurredOn: new Date()
      });

      return {
        success: true,
        message: 'Email updated successfully',
        account: account.toClientDTO()
      };

    } catch (error) {
      logger.error('[AccountEmailApplicationService] Email change failed', error);
      throw error;
    }
  }

  /**
   * 验证邮箱
   * @param token 验证令牌
   */
  async verifyEmail(token: string): Promise<EmailResponse> {
    // TODO: 实现邮箱验证逻辑
    // 需要 TokenRepository 之类的
    // 暂时存根
    return {
      success: false,
      message: 'Not implemented'
    };
  }
}
