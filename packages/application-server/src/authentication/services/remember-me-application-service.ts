/**
 * Remember Me Application Service
 * 记住我功能应用服务 - 负责记住我令牌相关操作的编排
 *
 * 职责（遵循 DDD 最佳实践）：
 * - 创建记住我令牌
 * - 验证记住我令牌
 * - 撤销记住我令牌
 * - 清理过期令牌
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

const logger = createLogger('RememberMeApplicationService');

/**
 * 创建记住我令牌请求接口
 */
export interface CreateRememberMeTokenRequest {
  accountUuid: string;
  deviceId: string;
  expiresInDays: number;
}

/**
 * 验证记住我令牌请求接口
 */
export interface ValidateRememberMeTokenRequest {
  token: string;
}

/**
 * 撤销记住我令牌请求接口
 */
export interface RevokeRememberMeTokenRequest {
  accountUuid: string;
  token?: string; // 如果不提供，撤销所有令牌
}

/**
 * 创建记住我令牌响应接口
 */
export interface CreateRememberMeTokenResponse {
  success: boolean;
  token: string;
  expiresAt: number;
  message: string;
}

/**
 * Remember Me Application Service
 * 负责记住我功能的核心业务逻辑编排
 */
export class RememberMeApplicationService {
  private credentialRepository: IAuthCredentialRepository;
  private authenticationDomainService: AuthenticationDomainService;

  constructor(credentialRepository: IAuthCredentialRepository) {
    this.credentialRepository = credentialRepository;
    this.authenticationDomainService = new AuthenticationDomainService();
  }

  /**
   * 创建记住我令牌主流程
   *
   * 步骤：
   * 1. 查询凭证
   * 2. 调用聚合根方法创建记住我令牌
   * 3. 持久化
   * 4. 发布令牌创建事件
   * 5. 返回响应
   */
  async createRememberMeToken(
    request: CreateRememberMeTokenRequest,
  ): Promise<CreateRememberMeTokenResponse> {
    logger.info('[RememberMeApplicationService] Creating remember me token', {
      accountUuid: request.accountUuid,
    });

    try {
      // ===== 步骤 1: 查询凭证 =====
      const credential = await this.credentialRepository.findByAccountUuid(request.accountUuid);
      if (!credential) {
        throw new Error('Credential not found');
      }

      // ===== 步骤 2: 调用聚合根方法创建记住我令牌 =====
      const rememberMeToken = credential.generateRememberMeToken(
        { deviceId: request.deviceId },
        request.expiresInDays,
      );

      // ===== 步骤 3: 持久化 =====
      await this.credentialRepository.save(credential);

      logger.info('[RememberMeApplicationService] Remember me token created', {
        accountUuid: request.accountUuid,
      });

      // ===== 步骤 4: 发布令牌创建事件 =====
      await this.publishTokenCreatedEvent(request.accountUuid);

      return {
        success: true,
        token: rememberMeToken.token,
        expiresAt: rememberMeToken.expiresAt,
        message: 'Remember me token created successfully',
      };
    } catch (error) {
      logger.error('[RememberMeApplicationService] Failed to create remember me token', {
        accountUuid: request.accountUuid,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * 验证记住我令牌
   *
   * 步骤：
   * 1. 查询所有凭证并查找匹配的令牌
   * 2. 验证令牌有效性
   * 3. 返回验证结果
   */
  async validateRememberMeToken(request: ValidateRememberMeTokenRequest): Promise<boolean> {
    logger.debug('[RememberMeApplicationService] Validating remember me token');

    try {
      // ===== 步骤 1: 查询所有凭证并查找匹配的令牌 =====
      // 简化实现：实际应该有专门的查询方法
      // TODO: 实现 findByRememberMeToken 方法

      // ===== 步骤 2: 验证令牌有效性 =====
      // TODO: 调用 DomainService 验证令牌

      logger.debug('[RememberMeApplicationService] Remember me token validation result');

      return true; // 简化实现
    } catch (error) {
      logger.error('[RememberMeApplicationService] Remember me token validation failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * 撤销记住我令牌
   *
   * 步骤：
   * 1. 查询凭证
   * 2. 调用聚合根方法撤销令牌
   * 3. 持久化
   * 4. 发布令牌撤销事件
   */
  async revokeRememberMeToken(request: RevokeRememberMeTokenRequest): Promise<void> {
    logger.info('[RememberMeApplicationService] Revoking remember me token', {
      accountUuid: request.accountUuid,
      token: request.token ? '***' : 'all',
    });

    try {
      // ===== 步骤 1: 查询凭证 =====
      const credential = await this.credentialRepository.findByAccountUuid(request.accountUuid);
      if (!credential) {
        throw new Error('Credential not found');
      }

      // ===== 步骤 2: 调用聚合根方法撤销令牌 =====
      if (request.token) {
        // 撤销指定令牌
        credential.revokeRememberMeToken(request.token);
      } else {
        // 撤销所有令牌
        credential.rememberMeTokens.forEach((token) => {
          credential.revokeRememberMeToken(token.token);
        });
      }

      // ===== 步骤 3: 持久化 =====
      await this.credentialRepository.save(credential);

      logger.info('[RememberMeApplicationService] Remember me token revoked', {
        accountUuid: request.accountUuid,
      });

      // ===== 步骤 4: 发布令牌撤销事件 =====
      await this.publishTokenRevokedEvent(request.accountUuid);
    } catch (error) {
      logger.error('[RememberMeApplicationService] Failed to revoke remember me token', {
        accountUuid: request.accountUuid,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * 清理过期令牌
   *
   * 步骤：
   * 1. 查询凭证
   * 2. 调用聚合根方法清理过期令牌
   * 3. 持久化
   */
  async cleanupExpiredTokens(accountUuid: string): Promise<void> {
    logger.debug('[RememberMeApplicationService] Cleaning up expired tokens', {
      accountUuid,
    });

    try {
      // ===== 步骤 1: 查询凭证 =====
      const credential = await this.credentialRepository.findByAccountUuid(accountUuid);
      if (!credential) {
        return;
      }

      // ===== 步骤 2: 调用聚合根方法清理过期令牌 =====
      credential.cleanupExpiredRememberMeTokens();

      // ===== 步骤 3: 持久化 =====
      await this.credentialRepository.save(credential);

      logger.debug('[RememberMeApplicationService] Expired tokens cleaned up', {
        accountUuid,
      });
    } catch (error) {
      logger.error('[RememberMeApplicationService] Failed to cleanup expired tokens', {
        accountUuid,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * 发布令牌创建事件
   */
  private async publishTokenCreatedEvent(accountUuid: string): Promise<void> {
    eventBus.publish({
      eventType: 'authentication:remember_me_token_created',
      payload: {
        accountUuid,
      },
      timestamp: Date.now(),
      aggregateId: accountUuid,
      occurredOn: new Date(),
    });

    logger.debug('[RememberMeApplicationService] Token created event published', {
      accountUuid,
    });
  }

  /**
   * 发布令牌撤销事件
   */
  private async publishTokenRevokedEvent(accountUuid: string): Promise<void> {
    eventBus.publish({
      eventType: 'authentication:remember_me_token_revoked',
      payload: {
        accountUuid,
      },
      timestamp: Date.now(),
      aggregateId: accountUuid,
      occurredOn: new Date(),
    });

    logger.debug('[RememberMeApplicationService] Token revoked event published', {
      accountUuid,
    });
  }
}
