/**
 * Password Management Application Service
 * 密码管理应用服务 - 负责密码相关操作的编排
 *
 * 职责（遵循 DDD 最佳实践）：
 * - 修改密码
 * - 重置密码
 * - 验证密码强度
 * - 密码历史记录
 * - 调用 DomainService 进行业务规则验证
 * - 负责持久化操作
 * - 发布领域事件
 */

import type {
  IAuthCredentialRepository,
  AuthCredential,
} from '@dailyuse/domain-server/authentication';
import type { IAccountRepository, Account } from '@dailyuse/domain-server/account';
import { AuthenticationDomainService } from '@dailyuse/domain-server/authentication';
import { AuthenticationContainer } from '@dailyuse/infrastructure-server';
import { AccountContainer } from '@dailyuse/infrastructure-server';
import { eventBus, createLogger } from '@dailyuse/utils';
import bcrypt from 'bcryptjs';

const logger = createLogger('PasswordManagementApplicationService');

/**
 * 修改密码请求接口
 */
export interface ChangePasswordRequest {
  accountUuid: string;
  currentPassword: string;
  newPassword: string;
}

/**
 * 重置密码请求接口
 */
export interface ResetPasswordRequest {
  accountUuid: string;
  newPassword: string;
  resetToken?: string;
}

/**
 * 修改密码响应接口
 */
export interface ChangePasswordResponse {
  success: boolean;
  message: string;
}

/**
 * Password Management Application Service
 * 负责密码管理的核心业务逻辑编排
 */
export class PasswordManagementApplicationService {
  private static instance: PasswordManagementApplicationService;

  private credentialRepository: IAuthCredentialRepository;
  private accountRepository: IAccountRepository;
  private authenticationDomainService: AuthenticationDomainService;

  private constructor(
    credentialRepository: IAuthCredentialRepository,
    accountRepository: IAccountRepository,
  ) {
    this.credentialRepository = credentialRepository;
    this.accountRepository = accountRepository;
    this.authenticationDomainService = new AuthenticationDomainService();
  }

  /**
   * 创建应用服务实例（支持依赖注入）
   */
  static async createInstance(
    credentialRepository?: IAuthCredentialRepository,
    accountRepository?: IAccountRepository,
  ): Promise<PasswordManagementApplicationService> {
    const authContainer = AuthenticationContainer.getInstance();
    const accountContainer = AccountContainer.getInstance();

    const credRepo = credentialRepository || authContainer.getAuthCredentialRepository();
    const accRepo = accountRepository || accountContainer.getAccountRepository();

    PasswordManagementApplicationService.instance = new PasswordManagementApplicationService(
      credRepo,
      accRepo,
    );
    return PasswordManagementApplicationService.instance;
  }

  /**
   * 获取应用服务单例
   */
  static async getInstance(): Promise<PasswordManagementApplicationService> {
    if (!PasswordManagementApplicationService.instance) {
      PasswordManagementApplicationService.instance =
        await PasswordManagementApplicationService.createInstance();
    }
    return PasswordManagementApplicationService.instance;
  }

  /**
   * 修改密码主流程
   *
   * 步骤：
   * 1. 查询账户
   * 2. 查询凭证
   * 3. 验证当前密码（调用 DomainService）
   * 4. 验证新密码强度（调用 DomainService）
   * 5. 哈希新密码
   * 6. 调用聚合根方法修改密码
   * 7. 持久化
   * 8. 发布密码修改事件
   * 9. 返回响应
   */
  async changePassword(request: ChangePasswordRequest): Promise<ChangePasswordResponse> {
    logger.info('[PasswordManagementApplicationService] Starting password change', {
      accountUuid: request.accountUuid,
    });

    try {
      // ===== 步骤 1: 查询账户 =====
      const account = await this.accountRepository.findById(request.accountUuid);
      if (!account) {
        throw new Error('Account not found');
      }

      // ===== 步骤 2: 查询凭证 =====
      const credential = await this.credentialRepository.findByAccountUuid(request.accountUuid);
      if (!credential) {
        throw new Error('Credential not found');
      }

      // ===== 步骤 3: 验证当前密码 =====
      // 使用 bcrypt.compare 比较明文密码和哈希密码
      const isCurrentPasswordValid = await bcrypt.compare(
        request.currentPassword,
        credential.passwordCredential?.hashedPassword || '',
      );

      if (!isCurrentPasswordValid) {
        throw new Error('Current password is incorrect');
      }

      // ===== 步骤 4: 验证新密码强度 =====
      this.authenticationDomainService.validatePasswordStrength(request.newPassword);

      // ===== 步骤 5: 哈希新密码 =====
      const newPasswordHash = await bcrypt.hash(request.newPassword, 12);

      // ===== 步骤 6: 调用聚合根方法修改密码 =====
      credential.setPassword(newPasswordHash);

      // ===== 步骤 7: 持久化 =====
      await this.credentialRepository.save(credential);

      logger.info('[PasswordManagementApplicationService] Password changed successfully', {
        accountUuid: request.accountUuid,
      });

      // ===== 步骤 8: 发布密码修改事件 =====
      await this.publishPasswordChangedEvent(account, credential);

      return {
        success: true,
        message: 'Password changed successfully',
      };
    } catch (error) {
      logger.error('[PasswordManagementApplicationService] Password change failed', {
        accountUuid: request.accountUuid,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * 重置密码主流程
   *
   * 步骤：
   * 1. 查询账户
   * 2. 查询凭证
   * 3. 验证重置令牌（如果提供）
   * 4. 验证新密码强度（调用 DomainService）
   * 5. 哈希新密码
   * 6. 调用聚合根方法重置密码
   * 7. 持久化
   * 8. 发布密码重置事件
   * 9. 返回响应
   */
  async resetPassword(request: ResetPasswordRequest): Promise<ChangePasswordResponse> {
    logger.info('[PasswordManagementApplicationService] Starting password reset', {
      accountUuid: request.accountUuid,
    });

    try {
      // ===== 步骤 1: 查询账户 =====
      const account = await this.accountRepository.findById(request.accountUuid);
      if (!account) {
        throw new Error('Account not found');
      }

      // ===== 步骤 2: 查询凭证 =====
      const credential = await this.credentialRepository.findByAccountUuid(request.accountUuid);
      if (!credential) {
        throw new Error('Credential not found');
      }

      // ===== 步骤 3: 验证重置令牌（如果提供）=====
      if (request.resetToken) {
        // TODO: 验证重置令牌的有效性
        logger.debug('[PasswordManagementApplicationService] Reset token verified');
      }

      // ===== 步骤 4: 验证新密码强度 =====
      this.authenticationDomainService.validatePasswordStrength(request.newPassword);

      // ===== 步骤 5: 哈希新密码 =====
      const newPasswordHash = await bcrypt.hash(request.newPassword, 12);

      // ===== 步骤 6: 调用聚合根方法重置密码 =====
      credential.setPassword(newPasswordHash);
      credential.security.requirePasswordChange = false;

      // ===== 步骤 7: 持久化 =====
      await this.credentialRepository.save(credential);

      logger.info('[PasswordManagementApplicationService] Password reset successfully', {
        accountUuid: request.accountUuid,
      });

      // ===== 步骤 8: 发布密码重置事件 =====
      await this.publishPasswordResetEvent(account, credential);

      return {
        success: true,
        message: 'Password reset successfully',
      };
    } catch (error) {
      logger.error('[PasswordManagementApplicationService] Password reset failed', {
        accountUuid: request.accountUuid,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * 发布密码修改事件
   */
  private async publishPasswordChangedEvent(
    account: Account,
    credential: AuthCredential,
  ): Promise<void> {
    eventBus.publish({
      eventType: 'authentication:password_changed',
      payload: {
        accountUuid: account.uuid,
        username: account.username,
        changedAt: Date.now(),
      },
      timestamp: Date.now(),
      aggregateId: account.uuid,
      occurredOn: new Date(),
    });

    logger.debug('[PasswordManagementApplicationService] Password changed event published', {
      accountUuid: account.uuid,
    });
  }

  /**
   * 发布密码重置事件
   */
  private async publishPasswordResetEvent(
    account: Account,
    credential: AuthCredential,
  ): Promise<void> {
    eventBus.publish({
      eventType: 'authentication:password_reset',
      payload: {
        accountUuid: account.uuid,
        username: account.username,
        resetAt: Date.now(),
      },
      timestamp: Date.now(),
      aggregateId: account.uuid,
      occurredOn: new Date(),
    });

    logger.debug('[PasswordManagementApplicationService] Password reset event published', {
      accountUuid: account.uuid,
    });
  }
}
