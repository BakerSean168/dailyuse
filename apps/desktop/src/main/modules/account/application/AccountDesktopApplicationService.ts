/**
 * Account Desktop Application Service (Refactored)
 *
 * 使用 DDD 最佳实践重构的 Account 应用服务：
 * 1. 作为 Use Cases 的 thin wrapper
 * 2. 统一返回 ClientDTO 类型
 * 3. 清晰的职责分离
 * 4. Desktop 特有逻辑（离线模式）与在线功能分离
 *
 * 架构原则：
 * - Application Service 只负责编排，不包含业务逻辑
 * - 所有业务逻辑在 Use Cases (@dailyuse/application-server) 中
 * - 返回类型统一使用 ClientDTO
 */

import {
  GetAccountProfile,
  UpdateAccountProfile,
} from '@dailyuse/account/application-server';

import type { AccountClientDTO, UpdateAccountProfileRequest } from '@dailyuse/contracts/account';
import { createLogger, type ILogger } from '@dailyuse/utils';

// ===== Types =====

/**
 * Desktop 本地用户（离线模式使用）
 */
export interface LocalDesktopUser {
  uuid: string;
  email: string;
  name: string;
  avatar: string | null;
  createdAt: string;
}

/**
 * Account 创建输入
 */
export interface CreateAccountInput {
  email: string;
  password: string;
  username?: string;
}

/**
 * Account 创建输出
 */
export interface CreateAccountResult {
  success: boolean;
  uuid?: string;
  error?: string;
}

/**
 * 通用操作结果
 */
export interface OperationResult {
  success: boolean;
  error?: string;
}

/**
 * 订阅信息
 */
export interface SubscriptionInfo {
  plan: string;
  status: string;
  features: string[];
}

/**
 * 使用量信息
 */
export interface UsageInfo {
  storage: { used: number; limit: number };
  api: { used: number; limit: number };
}

// ===== Constants =====

/**
 * 本地 Desktop 用户（离线模式）
 */
const LOCAL_DESKTOP_USER: LocalDesktopUser = {
  uuid: 'local-user',
  email: 'local@desktop.app',
  name: 'Desktop User',
  avatar: null,
  createdAt: new Date().toISOString(),
};

/**
 * Desktop 免费订阅
 */
const DESKTOP_FREE_SUBSCRIPTION: SubscriptionInfo = {
  plan: 'desktop-free',
  status: 'active',
  features: ['offline-mode', 'local-storage', 'unlimited-goals', 'unlimited-tasks'],
};

// ===== Application Service =====

/**
 * Account Desktop Application Service
 *
 * 为 Desktop IPC handlers 提供统一的应用服务入口
 * Desktop 版本主要使用离线模式，大部分在线功能返回占位符
 */
export class AccountDesktopApplicationService {
  private readonly logger: ILogger;

  constructor(logger?: ILogger) {
    this.logger = logger || createLogger('AccountDesktopAppService');
  }

  // ============================================
  // Core Account (Online Mode - Placeholder)
  // ============================================

  /**
   * 创建账户
   * @description 仅在线模式可用，Desktop 离线模式返回占位符
   */
  async createAccount(input: CreateAccountInput): Promise<CreateAccountResult> {
    this.logger.debug('Creating account', { email: input.email });

    // TODO: 实现在线模式
    // const result = await registerAccount(input);
    // return { success: true, uuid: result.account.uuid };

    return {
      success: false,
      error: 'Desktop offline mode - online account creation not supported',
    };
  }

  /**
   * 获取账户
   * @returns AccountClientDTO 或 LocalDesktopUser（离线模式）
   */
  async getAccount(uuid: string): Promise<AccountClientDTO | LocalDesktopUser | null> {
    this.logger.debug('Getting account', { uuid });

    // Desktop 离线模式：返回本地用户
    if (uuid === 'local-user') {
      return LOCAL_DESKTOP_USER;
    }

    // 在线模式：使用 Use Case
    try {
      const account = await GetAccountProfile.getInstance().execute(uuid);
      return account;
    } catch (error) {
      this.logger.warn('Failed to get account from server', { uuid, error });
      return null;
    }
  }

  /**
   * 更新账户
   */
  async updateAccount(
    uuid: string,
    input: UpdateAccountProfileRequest,
  ): Promise<AccountClientDTO | LocalDesktopUser | null> {
    this.logger.debug('Updating account', { uuid });

    // Desktop 离线模式：返回更新后的本地用户
    if (uuid === 'local-user') {
      return {
        ...LOCAL_DESKTOP_USER,
        name: input.displayName || LOCAL_DESKTOP_USER.name,
      };
    }

    // 在线模式：使用 Use Case
    try {
      const account = await UpdateAccountProfile.getInstance().execute(uuid, input);
      return account;
    } catch (error) {
      this.logger.error('Failed to update account', { uuid, error });
      return null;
    }
  }

  /**
   * 删除账户
   * @description 本地账户不可删除
   */
  async deleteAccount(uuid: string): Promise<OperationResult> {
    this.logger.debug('Deleting account', { uuid });

    if (uuid === 'local-user') {
      return { success: false, error: 'Cannot delete local desktop account' };
    }

    // TODO: 实现在线模式删除
    return { success: false, error: 'Account deletion not implemented' };
  }

  // ============================================
  // Me (Current User)
  // ============================================

  /**
   * 获取当前用户
   * @description Desktop 离线模式返回本地用户
   */
  async getCurrentUser(): Promise<LocalDesktopUser> {
    this.logger.debug('Getting current user');
    return LOCAL_DESKTOP_USER;
  }

  /**
   * 更新当前用户
   */
  async updateCurrentUser(input: { name?: string; email?: string }): Promise<OperationResult> {
    this.logger.debug('Updating current user', input);
    // Desktop 离线模式：本地更新（实际不持久化）
    return { success: true };
  }

  /**
   * 更改密码
   * @description 仅在线模式可用
   */
  async changePassword(_oldPassword: string, _newPassword: string): Promise<OperationResult> {
    this.logger.debug('Changing password');
    return { success: false, error: 'Desktop offline mode - password change not supported' };
  }

  /**
   * 更改邮箱
   * @description 仅在线模式可用
   */
  async changeEmail(_newEmail: string): Promise<OperationResult> {
    this.logger.debug('Changing email');
    return { success: false, error: 'Desktop offline mode - email change not supported' };
  }

  /**
   * 验证邮箱
   * @description 仅在线模式可用
   */
  async verifyEmail(_token: string): Promise<OperationResult> {
    this.logger.debug('Verifying email');
    return { success: false, error: 'Desktop offline mode - email verification not supported' };
  }

  /**
   * 删除当前用户
   * @description 本地用户不可删除
   */
  async deleteCurrentUser(): Promise<OperationResult> {
    this.logger.debug('Deleting current user');
    return { success: false, error: 'Cannot delete local desktop account' };
  }

  // ============================================
  // Profile
  // ============================================

  /**
   * 获取用户资料
   * @returns AccountClientDTO 或 null
   */
  async getProfile(uuid: string): Promise<AccountClientDTO | null> {
    this.logger.debug('Getting profile', { uuid });

    try {
      return await GetAccountProfile.getInstance().execute(uuid);
    } catch (error) {
      this.logger.warn('Failed to get profile', { uuid, error });
      return null;
    }
  }

  /**
   * 更新用户资料
   * @returns AccountClientDTO 或 null
   */
  async updateProfile(
    uuid: string,
    input: Partial<UpdateAccountProfileRequest>,
  ): Promise<AccountClientDTO | null> {
    this.logger.debug('Updating profile', { uuid });

    try {
      return await UpdateAccountProfile.getInstance().execute(uuid, input as UpdateAccountProfileRequest);
    } catch (error) {
      this.logger.error('Failed to update profile', { uuid, error });
      return null;
    }
  }

  /**
   * 上传头像
   * @description TODO: 实现本地头像存储
   */
  async uploadAvatar(uuid: string, _imageData: string): Promise<{ success: boolean; avatarUrl: string | null }> {
    this.logger.debug('Uploading avatar', { uuid });
    // TODO: 实现本地头像存储
    return { success: true, avatarUrl: null };
  }

  /**
   * 移除头像
   */
  async removeAvatar(uuid: string): Promise<OperationResult> {
    this.logger.debug('Removing avatar', { uuid });
    return { success: true };
  }

  // ============================================
  // Subscription (Desktop Free Mode)
  // ============================================

  /**
   * 获取订阅信息
   * @description Desktop 默认免费订阅
   */
  async getSubscription(): Promise<SubscriptionInfo> {
    this.logger.debug('Getting subscription');
    return DESKTOP_FREE_SUBSCRIPTION;
  }

  /**
   * 升级订阅
   * @description 仅在线模式可用
   */
  async upgradeSubscription(_planId: string): Promise<OperationResult> {
    this.logger.debug('Upgrading subscription');
    return { success: false, error: 'Desktop offline mode - subscription upgrade not available' };
  }

  /**
   * 取消订阅
   * @description 仅在线模式可用
   */
  async cancelSubscription(): Promise<OperationResult> {
    this.logger.debug('Cancelling subscription');
    return { success: false, error: 'Desktop offline mode - no subscription to cancel' };
  }

  /**
   * 获取发票
   * @description 仅在线模式可用
   */
  async getInvoices(): Promise<{ invoices: unknown[]; total: number }> {
    this.logger.debug('Getting invoices');
    return { invoices: [], total: 0 };
  }

  /**
   * 获取使用量
   * @description Desktop 本地使用量无限制
   */
  async getUsage(): Promise<UsageInfo> {
    this.logger.debug('Getting usage');
    return {
      storage: { used: 0, limit: -1 }, // -1 表示无限制
      api: { used: 0, limit: -1 },
    };
  }
}

// ===== Factory Function =====

/**
 * 创建 AccountDesktopApplicationService 实例
 */
export function createAccountDesktopApplicationService(
  logger?: ILogger,
): AccountDesktopApplicationService {
  return new AccountDesktopApplicationService(logger);
}
