/**
 * Two Factor Application Service
 * 双因素认证应用服务 - 负责双因素认证相关操作的编排
 *
 * 职责（遵循 DDD 最佳实践）：
 * - 启用双因素认证
 * - 禁用双因素认证
 * - 验证双因素代码
 * - 生成备用代码
 * - 调用 DomainService 进行业务规则验证
 * - 负责持久化操作
 * - 发布领域事件
 */

import type {
  IAuthCredentialRepository,
  AuthCredential,
} from '@dailyuse/domain-server/authentication';
import { AuthenticationDomainService } from '@dailyuse/domain-server/authentication';
import { eventBus, createLogger } from '@dailyuse/utils';

const logger = createLogger('TwoFactorApplicationService');

/**
 * 启用双因素认证请求接口
 */
export interface EnableTwoFactorRequest {
  accountUuid: string;
  method: 'TOTP' | 'SMS' | 'EMAIL' | 'AUTHENTICATOR_APP';
  secret: string;
  verificationCode: string; // 用户输入的验证码
}

/**
 * 禁用双因素认证请求接口
 */
export interface DisableTwoFactorRequest {
  accountUuid: string;
  password: string; // 需要验证密码
}

/**
 * 验证双因素代码请求接口
 */
export interface VerifyTwoFactorRequest {
  accountUuid: string;
  code: string;
}

/**
 * 启用双因素认证响应接口
 */
export interface EnableTwoFactorResponse {
  success: boolean;
  backupCodes: string[];
  message: string;
}

/**
 * Two Factor Application Service
 * 负责双因素认证的核心业务逻辑编排
 */
export class TwoFactorApplicationService {
  private credentialRepository: IAuthCredentialRepository;
  private authenticationDomainService: AuthenticationDomainService;

  constructor(credentialRepository: IAuthCredentialRepository) {
    this.credentialRepository = credentialRepository;
    this.authenticationDomainService = new AuthenticationDomainService();
  }

  /**
   * 启用双因素认证主流程
   *
   * 步骤：
   * 1. 查询凭证
   * 2. 验证验证码（调用 DomainService）
   * 3. 调用聚合根方法启用双因素认证
   * 4. 生成备用代码
   * 5. 持久化
   * 6. 发布启用事件
   * 7. 返回响应（包含备用代码）
   */
  async enableTwoFactor(request: EnableTwoFactorRequest): Promise<EnableTwoFactorResponse> {
    logger.info('[TwoFactorApplicationService] Enabling two-factor authentication', {
      accountUuid: request.accountUuid,
      method: request.method,
    });

    try {
      // ===== 步骤 1: 查询凭证 =====
      const credential = await this.credentialRepository.findByAccountUuid(request.accountUuid);
      if (!credential) {
        throw new Error('Credential not found');
      }

      // ===== 步骤 2: 验证验证码 =====
      const isCodeValid = this.authenticationDomainService.verifyTwoFactorCode(
        credential,
        request.verificationCode,
      );
      if (!isCodeValid) {
        throw new Error('Invalid verification code');
      }

      // ===== 步骤 3: 调用聚合根方法启用双因素认证 =====
      // enableTwoFactor 方法会自动生成 secret 和 backupCodes
      const generatedSecret = credential.enableTwoFactor(request.method);

      // ===== 步骤 4: 获取生成的备用代码 =====
      const backupCodes = credential.twoFactor?.backupCodes || [];

      // ===== 步骤 5: 持久化 =====
      await this.credentialRepository.save(credential);

      logger.info('[TwoFactorApplicationService] Two-factor authentication enabled', {
        accountUuid: request.accountUuid,
      });

      // ===== 步骤 6: 发布启用事件 =====
      await this.publishTwoFactorEnabledEvent(request.accountUuid, request.method);

      return {
        success: true,
        backupCodes,
        message: 'Two-factor authentication enabled successfully',
      };
    } catch (error) {
      logger.error('[TwoFactorApplicationService] Failed to enable two-factor authentication', {
        accountUuid: request.accountUuid,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * 禁用双因素认证主流程
   *
   * 步骤：
   * 1. 查询凭证
   * 2. 验证密码（确保是账户所有者）
   * 3. 调用聚合根方法禁用双因素认证
   * 4. 持久化
   * 5. 发布禁用事件
   */
  async disableTwoFactor(request: DisableTwoFactorRequest): Promise<void> {
    logger.info('[TwoFactorApplicationService] Disabling two-factor authentication', {
      accountUuid: request.accountUuid,
    });

    try {
      // ===== 步骤 1: 查询凭证 =====
      const credential = await this.credentialRepository.findByAccountUuid(request.accountUuid);
      if (!credential) {
        throw new Error('Credential not found');
      }

      // ===== 步骤 2: 验证密码 =====
      const isPasswordValid = this.authenticationDomainService.verifyPassword(
        credential,
        request.password,
      );
      if (!isPasswordValid) {
        throw new Error('Invalid password');
      }

      // ===== 步骤 3: 调用聚合根方法禁用双因素认证 =====
      credential.disableTwoFactor();

      // ===== 步骤 4: 持久化 =====
      await this.credentialRepository.save(credential);

      logger.info('[TwoFactorApplicationService] Two-factor authentication disabled', {
        accountUuid: request.accountUuid,
      });

      // ===== 步骤 5: 发布禁用事件 =====
      await this.publishTwoFactorDisabledEvent(request.accountUuid);
    } catch (error) {
      logger.error('[TwoFactorApplicationService] Failed to disable two-factor authentication', {
        accountUuid: request.accountUuid,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * 验证双因素代码
   *
   * 步骤：
   * 1. 查询凭证
   * 2. 调用 DomainService 验证代码
   * 3. 返回验证结果
   */
  async verifyTwoFactorCode(request: VerifyTwoFactorRequest): Promise<boolean> {
    logger.debug('[TwoFactorApplicationService] Verifying two-factor code', {
      accountUuid: request.accountUuid,
    });

    try {
      // ===== 步骤 1: 查询凭证 =====
      const credential = await this.credentialRepository.findByAccountUuid(request.accountUuid);
      if (!credential) {
        return false;
      }

      // ===== 步骤 2: 调用 DomainService 验证代码 =====
      const isValid = this.authenticationDomainService.verifyTwoFactorCode(
        credential,
        request.code,
      );

      logger.debug('[TwoFactorApplicationService] Two-factor code verification result', {
        accountUuid: request.accountUuid,
        isValid,
      });

      return isValid;
    } catch (error) {
      logger.error('[TwoFactorApplicationService] Two-factor code verification failed', {
        accountUuid: request.accountUuid,
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * 生成备用代码
   */
  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  /**
   * 发布双因素认证启用事件
   */
  private async publishTwoFactorEnabledEvent(accountUuid: string, method: string): Promise<void> {
    eventBus.publish({
      eventType: 'authentication:two_factor_enabled',
      payload: {
        accountUuid,
        method,
      },
      timestamp: Date.now(),
      aggregateId: accountUuid,
      occurredOn: new Date(),
    });

    logger.debug('[TwoFactorApplicationService] Two-factor enabled event published', {
      accountUuid,
    });
  }

  /**
   * 发布双因素认证禁用事件
   */
  private async publishTwoFactorDisabledEvent(accountUuid: string): Promise<void> {
    eventBus.publish({
      eventType: 'authentication:two_factor_disabled',
      payload: {
        accountUuid,
      },
      timestamp: Date.now(),
      aggregateId: accountUuid,
      occurredOn: new Date(),
    });

    logger.debug('[TwoFactorApplicationService] Two-factor disabled event published', {
      accountUuid,
    });
  }
}
