/**
 * Account Application Service - Renderer
 *
 * 账户应用服务 - 渲染进程
 *
 * 职责：
 * - 作为展示层与 Use Cases 之间的桥梁
 * - 调用 @dailyuse/application-client 的 Use Cases
 * - application-client 已返回 Entity 对象，直接透传
 * - 不包含业务逻辑
 */

import {
  // Service Classes
  GetMyProfile,
  UpdateMyProfile,
  ChangeMyPassword,
  UpdateAccountPreferences,
  GetAccountById,
  GetSubscription,
  GetAccountStats,
} from '@dailyuse/application-client';
import type {
  UpdateAccountPreferencesRequestDTO,
  AccountStatsResponseDTO,
  UpdateAccountProfileRequestDTO,
} from '@dailyuse/contracts/account';
import type { Account } from '@dailyuse/domain-client/account';
import { Subscription } from '@dailyuse/domain-client/account';

/**
 * Change My Password Request
 */
export interface ChangeMyPasswordRequest {
  currentPassword: string;
  newPassword: string;
}

/**
 * Change My Password Result
 */
export interface ChangeMyPasswordResult {
  success: boolean;
  message: string;
}

/**
 * Account Application Service
 *
 * 渲染进程账户应用服务
 */
export class AccountApplicationService {
  private static instance: AccountApplicationService;

  private constructor() {}

  static getInstance(): AccountApplicationService {
    if (!AccountApplicationService.instance) {
      AccountApplicationService.instance = new AccountApplicationService();
    }
    return AccountApplicationService.instance;
  }

  // ===== Profile =====

  /**
   * 获取当前用户资料
   * @returns Account 实体对象
   */
  async getMyProfile(): Promise<Account> {
    return GetMyProfile.getInstance().execute();
  }

  /**
   * 更新当前用户资料
   * @returns Account 实体对象
   */
  async updateMyProfile(input: UpdateAccountProfileRequestDTO): Promise<Account> {
    return UpdateMyProfile.getInstance().execute(input);
  }

  /**
   * 修改密码
   */
  async changeMyPassword(input: ChangeMyPasswordRequest): Promise<ChangeMyPasswordResult> {
    return ChangeMyPassword.getInstance().execute(input);
  }

  /**
   * 获取指定账户
   * @returns Account 实体对象 or null
   */
  async getAccountById(accountId: string): Promise<Account | null> {
    try {
      return await GetAccountById.getInstance().execute(accountId);
    } catch {
      return null;
    }
  }

  // ===== Preferences =====

  /**
   * 更新账户偏好设置
   * @returns Account 实体对象
   */
  async updatePreferences(
    accountId: string,
    request: UpdateAccountPreferencesRequestDTO,
  ): Promise<Account> {
    const dto = await UpdateAccountPreferences.getInstance().execute(accountId, request);
    // UpdateAccountPreferences 暂未更新，手动转换
    const { Account } = await import('@dailyuse/domain-client/account');
    return Account.fromClientDTO(dto);
  }

  // ===== Subscription =====

  /**
   * 获取订阅信息
   * @returns Subscription 实体对象 or null
   */
  async getSubscription(accountId: string): Promise<Subscription | null> {
    try {
      const result = await GetSubscription.getInstance().execute(accountId);
      return result ? Subscription.fromClientDTO(result) : null;
    } catch {
      return null;
    }
  }

  // ===== Stats =====

  /**
   * 获取账户统计
   */
  async getAccountStats(): Promise<AccountStatsResponseDTO | null> {
    try {
      return await GetAccountStats.getInstance().execute();
    } catch {
      return null;
    }
  }
}

// 导出单例实例
export const accountApplicationService = AccountApplicationService.getInstance();
