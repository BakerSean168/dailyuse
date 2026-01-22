/**
 * Session Management Application Service
 * 会话管理应用服务 - 负责会话相关操作的编排
 *
 * 职责（遵循 DDD 最佳实践）：
 * - 刷新会话
 * - 验证会话
 * - 终止会话（登出）
 * - 终止所有会话
 * - 查询活跃会话
 * - 调用 DomainService 进行业务规则验证
 * - 负责持久化操作
 * - 发布领域事件
 */

import crypto from 'crypto';
import type { IAuthSessionRepository, AuthSession } from '@dailyuse/domain-server/authentication';
import type { IAccountRepository, Account } from '@dailyuse/domain-server/account';
import { AuthenticationDomainService } from '@dailyuse/domain-server/authentication';
import { eventBus, createLogger } from '@dailyuse/utils';
// TODO: Remove direct infrastructure dependencies - use dependency injection instead
// import { getJwtConfig } from '@/shared/infrastructure/config/env.js';
import jwt from 'jsonwebtoken';

const logger = createLogger('SessionManagementApplicationService');

/**
 * 刷新会话请求接口
 */
export interface RefreshSessionRequest {
  refreshToken: string;
}

/**
 * 验证会话请求接口
 */
export interface ValidateSessionRequest {
  accessToken: string;
}

/**
 * 终止会话请求接口
 */
export interface TerminateSessionRequest {
  sessionUuid: string;
  accountUuid: string;
}

/**
 * 终止所有会话请求接口
 */
export interface TerminateAllSessionsRequest {
  accountUuid: string;
  exceptSessionUuid?: string; // 可选：保留指定会话
}

/**
 * 刷新会话响应接口
 */
export interface RefreshSessionResponse {
  success: boolean;
  session: {
    sessionUuid: string;
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
  };
  message: string;
}

/**
 * Session Management Application Service
 * 负责会话管理的核心业务逻辑编排
 */
export class SessionManagementApplicationService {
  private sessionRepository: IAuthSessionRepository;
  private accountRepository: IAccountRepository;
  private authenticationDomainService: AuthenticationDomainService;
  private jwtSecret: string;

  constructor(
    sessionRepository: IAuthSessionRepository,
    accountRepository: IAccountRepository,
    jwtSecret: string = process.env.JWT_SECRET || 'default-secret-change-in-production',
  ) {
    this.sessionRepository = sessionRepository;
    this.accountRepository = accountRepository;
    this.authenticationDomainService = new AuthenticationDomainService();
    this.jwtSecret = jwtSecret;
  }

  /**
   * 刷新会话主流程
   *
   * 步骤：
   * 1. 查询会话（通过 refreshToken）
   * 2. 验证会话有效性（调用 DomainService）
   * 3. 生成新的访问令牌和刷新令牌
   * 4. 调用聚合根方法刷新会话
   * 5. 持久化
   * 6. 发布会话刷新事件
   * 7. 返回响应
   */
  async refreshSession(request: RefreshSessionRequest): Promise<RefreshSessionResponse> {
    logger.info('[SessionManagementApplicationService] Starting session refresh');

    try {
      // ===== 步骤 1: 查询会话 =====
      const session = await this.sessionRepository.findByRefreshToken(request.refreshToken);
      if (!session) {
        // 🔥 友好的错误信息：明确告诉前端是 Refresh Token 过期
        const error = new Error('REFRESH_TOKEN_EXPIRED');
        (error as any).code = 'REFRESH_TOKEN_EXPIRED';
        (error as any).statusCode = 401;
        (error as any).userMessage = '登录已过期，请重新登录';
        throw error;
      }

      // ===== 步骤 2: 验证会话有效性 =====
      const isValid = this.authenticationDomainService.validateSession(session);
      if (!isValid) {
        // 检查是否被撤销
        if (session.revokedAt) {
          const error = new Error('SESSION_REVOKED');
          (error as any).code = 'SESSION_REVOKED';
          (error as any).statusCode = 401;
          (error as any).userMessage = '会话已被撤销，请重新登录';
          throw error;
        }

        // 其他无效原因
        const error = new Error('SESSION_INVALID');
        (error as any).code = 'SESSION_INVALID';
        (error as any).statusCode = 401;
        (error as any).userMessage = '会话无效，请重新登录';
        throw error;
      }

      // ===== 步骤 3: 生成新的 Access Token =====
      const { accessToken, expiresAt } = this.generateTokens(session.accountUuid);

      // ===== 步骤 4: Sliding Window - 每次刷新时都自动续期 Refresh Token =====
      // 🔥 简化逻辑：直接调用聚合根方法，重新生成 Refresh Token
      // 这样只要用户持续使用，Session 永远不会过期
      session.refreshRefreshToken();
      const newRefreshToken = session.refreshToken.token;

      logger.info('[SessionManagementApplicationService] 🔄 Tokens refreshed', {
        sessionUuid: session.uuid,
        newRefreshTokenExpiresAt: new Date(session.refreshToken.expiresAt).toISOString(),
      });

      // ===== 步骤 5: 更新 Access Token =====
      session.refreshAccessToken(accessToken, 60); // 60 minutes

      // ===== 步骤 5: 持久化 =====
      await this.sessionRepository.save(session);

      logger.info('[SessionManagementApplicationService] Session refreshed successfully', {
        sessionUuid: session.uuid,
      });

      // ===== 步骤 6: 发布会话刷新事件 =====
      await this.publishSessionRefreshedEvent(session);

      return {
        success: true,
        session: {
          sessionUuid: session.uuid,
          accessToken,
          refreshToken: newRefreshToken, // 返回可能续期的 Refresh Token
          expiresAt,
        },
        message: 'Session refreshed successfully',
      };
    } catch (error) {
      logger.error('[SessionManagementApplicationService] Session refresh failed', {
        error: error instanceof Error ? error.message : String(error),
        code: (error as any).code,
      });
      throw error;
    }
  }

  /**
   * 验证会话有效性
   *
   * 步骤：
   * 1. 查询会话（通过 accessToken）
   * 2. 调用 DomainService 验证会话有效性
   * 3. 返回验证结果
   */
  async validateSession(request: ValidateSessionRequest): Promise<boolean> {
    logger.debug('[SessionManagementApplicationService] Validating session');

    try {
      // ===== 步骤 1: 查询会话 =====
      const session = await this.sessionRepository.findByAccessToken(request.accessToken);
      if (!session) {
        return false;
      }

      // ===== 步骤 2: 调用 DomainService 验证会话有效性 =====
      const isValid = this.authenticationDomainService.validateSession(session);

      logger.debug('[SessionManagementApplicationService] Session validation result', {
        sessionUuid: session.uuid,
        isValid,
      });

      return isValid;
    } catch (error) {
      logger.error('[SessionManagementApplicationService] Session validation failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * 终止会话（登出）
   *
   * 步骤：
   * 1. 查询会话
   * 2. 调用聚合根方法终止会话
   * 3. 持久化
   * 4. 发布会话终止事件
   */
  async terminateSession(request: TerminateSessionRequest): Promise<void> {
    logger.info('[SessionManagementApplicationService] Terminating session', {
      sessionUuid: request.sessionUuid,
    });

    try {
      // ===== 步骤 1: 查询会话 =====
      const session = await this.sessionRepository.findByUuid(request.sessionUuid);
      if (!session) {
        throw new Error('Session not found');
      }

      // 验证会话所有者
      if (session.accountUuid !== request.accountUuid) {
        throw new Error('Unauthorized to terminate this session');
      }

      // ===== 步骤 2: 调用聚合根方法终止会话 =====
      session.revoke();

      // ===== 步骤 3: 持久化 =====
      await this.sessionRepository.save(session);

      logger.info('[SessionManagementApplicationService] Session terminated successfully', {
        sessionUuid: request.sessionUuid,
      });

      // ===== 步骤 4: 发布会话终止事件 =====
      await this.publishSessionTerminatedEvent(session);
    } catch (error) {
      logger.error('[SessionManagementApplicationService] Session termination failed', {
        sessionUuid: request.sessionUuid,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * 终止所有会话
   *
   * 步骤：
   * 1. 查询账户的所有活跃会话
   * 2. 过滤掉排除的会话（如果指定）
   * 3. 终止所有会话
   * 4. 批量持久化
   * 5. 发布批量终止事件
   */
  async terminateAllSessions(request: TerminateAllSessionsRequest): Promise<void> {
    logger.info('[SessionManagementApplicationService] Terminating all sessions', {
      accountUuid: request.accountUuid,
      exceptSessionUuid: request.exceptSessionUuid,
    });

    try {
      // ===== 步骤 1: 查询账户的所有活跃会话 =====
      const sessions = await this.sessionRepository.findByAccountUuid(request.accountUuid);

      // ===== 步骤 2: 过滤掉排除的会话（只保留活跃会话）=====
      const sessionsToTerminate = sessions.filter((s: AuthSession) => {
        if (request.exceptSessionUuid && s.uuid === request.exceptSessionUuid) {
          return false;
        }
        return s.status === 'ACTIVE';
      });

      if (sessionsToTerminate.length === 0) {
        logger.info('[SessionManagementApplicationService] No sessions to terminate');
        return;
      }

      // ===== 步骤 3: 终止所有会话 =====
      sessionsToTerminate.forEach((session: AuthSession) => {
        session.revoke();
      });

      // ===== 步骤 4: 批量持久化 =====
      await Promise.all(
        sessionsToTerminate.map((session: AuthSession) => this.sessionRepository.save(session)),
      );

      logger.info('[SessionManagementApplicationService] All sessions terminated successfully', {
        accountUuid: request.accountUuid,
        terminatedCount: sessionsToTerminate.length,
      });

      // ===== 步骤 5: 发布批量终止事件 =====
      await this.publishAllSessionsTerminatedEvent(request.accountUuid, sessionsToTerminate);
    } catch (error) {
      logger.error('[SessionManagementApplicationService] Terminate all sessions failed', {
        accountUuid: request.accountUuid,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * 查询活跃会话列表
   */
  async getActiveSessions(accountUuid: string): Promise<AuthSession[]> {
    logger.debug('[SessionManagementApplicationService] Getting active sessions', {
      accountUuid,
    });

    try {
      const allSessions = await this.sessionRepository.findByAccountUuid(accountUuid);
      const sessions = allSessions.filter((s: AuthSession) => s.status === 'ACTIVE');

      logger.debug('[SessionManagementApplicationService] Active sessions retrieved', {
        accountUuid,
        count: sessions.length,
      });

      return sessions;
    } catch (error) {
      logger.error('[SessionManagementApplicationService] Get active sessions failed', {
        accountUuid,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * 生成访问令牌和刷新令牌
   */
  private generateTokens(accountUuid: string): {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
  } {
    const secret = this.jwtSecret;
    const accessTokenExpiresIn = 3600; // 1 hour in seconds
    const refreshTokenExpiresIn = 30 * 24 * 3600; // 30 days in seconds（与 AuthSession 一致）
    const expiresAt = Date.now() + accessTokenExpiresIn * 1000; // milliseconds

    const now = Math.floor(Date.now() / 1000);

    // Generate JWT access token with enhanced security
    const accessToken = jwt.sign(
      {
        accountUuid,
        type: 'access',
        iat: now,
        jti: crypto.randomBytes(16).toString('hex'), // Unique token ID
        iss: 'dailyuse-api', // Issuer
        aud: 'dailyuse-client', // Audience
      },
      secret,
      {
        algorithm: 'HS256', // Explicitly specify algorithm
        expiresIn: accessTokenExpiresIn,
      },
    );

    const refreshToken = this.generateRefreshToken(accountUuid, refreshTokenExpiresIn);

    return {
      accessToken,
      refreshToken,
      expiresAt,
    };
  }

  /**
   * 🔥 生成 Refresh Token（独立方法，支持自定义有效期）
   */
  private generateRefreshToken(accountUuid: string, expiresIn: number = 30 * 24 * 3600): string {
    const secret = this.jwtSecret;
    const now = Math.floor(Date.now() / 1000);

    // Generate JWT refresh token (longer expiry, different payload)
    return jwt.sign(
      {
        accountUuid,
        type: 'refresh',
        iat: now,
        jti: crypto.randomBytes(16).toString('hex'), // Different unique token ID
        iss: 'dailyuse-api',
        aud: 'dailyuse-client',
        // Refresh token should have different claims to distinguish from access token
        purpose: 'token-refresh',
      },
      secret,
      {
        algorithm: 'HS256',
        expiresIn: expiresIn,
      },
    );
  }

  /**
   * 发布会话刷新事件
   */
  private async publishSessionRefreshedEvent(session: AuthSession): Promise<void> {
    eventBus.publish({
      eventType: 'authentication:session_refreshed',
      payload: {
        sessionUuid: session.uuid,
        accountUuid: session.accountUuid,
      },
      timestamp: Date.now(),
      aggregateId: session.uuid,
      occurredOn: new Date(),
    });

    logger.debug('[SessionManagementApplicationService] Session refreshed event published', {
      sessionUuid: session.uuid,
    });
  }

  /**
   * 发布会话终止事件
   */
  private async publishSessionTerminatedEvent(session: AuthSession): Promise<void> {
    eventBus.publish({
      eventType: 'authentication:session_terminated',
      payload: {
        sessionUuid: session.uuid,
        accountUuid: session.accountUuid,
      },
      timestamp: Date.now(),
      aggregateId: session.uuid,
      occurredOn: new Date(),
    });

    logger.debug('[SessionManagementApplicationService] Session terminated event published', {
      sessionUuid: session.uuid,
    });
  }

  /**
   * 发布批量终止会话事件
   */
  private async publishAllSessionsTerminatedEvent(
    accountUuid: string,
    sessions: AuthSession[],
  ): Promise<void> {
    eventBus.publish({
      eventType: 'authentication:all_sessions_terminated',
      payload: {
        accountUuid,
        sessionCount: sessions.length,
        sessionUuids: sessions.map((s) => s.uuid),
      },
      timestamp: Date.now(),
      aggregateId: accountUuid,
      occurredOn: new Date(),
    });

    logger.debug('[SessionManagementApplicationService] All sessions terminated event published', {
      accountUuid,
      count: sessions.length,
    });
  }
}
