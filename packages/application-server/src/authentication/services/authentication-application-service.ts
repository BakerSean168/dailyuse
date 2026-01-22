/**
 * Authentication Application Service
 * 认证应用服务 - 负责用户登录和认证流程编排
 *
 * 职责（遵循 DDD 最佳实践）：
 * - 用户登录验证
 * - 密码验证
 * - 创建会话（Session）
 * - 记录失败登录
 * - 锁定/解锁凭证
 * - 调用 DomainService 进行业务规则验证
 * - 负责持久化操作
 * - 发布领域事件
 */

import crypto from 'crypto';
import type {
  IAuthCredentialRepository,
  IAuthSessionRepository,
  AuthCredential,
  AuthSession,
} from '@dailyuse/domain-server/authentication';
import type { IAccountRepository, Account } from '@dailyuse/domain-server/account';
import { AuthenticationDomainService } from '@dailyuse/domain-server/authentication';
import { eventBus, createLogger } from '@dailyuse/utils';
// TODO: Remove direct infrastructure dependencies - use dependency injection instead
// import { prisma } from '@/shared/infrastructure/config/prisma';
// import { getJwtConfig } from '@/shared/infrastructure/config/env.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const logger = createLogger('AuthenticationApplicationService');

/**
 * 登录请求接口
 */
export interface LoginRequest {
  identifier: string; // 用户名或邮箱
  password: string;
  deviceInfo: {
    deviceId: string;
    deviceName: string;
    deviceType: 'WEB' | 'MOBILE' | 'DESKTOP' | 'TABLET' | 'OTHER';
    platform: string;
    browser?: string;
    osVersion?: string;
  };
  ipAddress: string;
  location?: {
    country?: string;
    region?: string;
    city?: string;
    timezone?: string;
  };
}

/**
 * 登录响应接口
 */
export interface LoginResponse {
  success: boolean;
  session: {
    sessionUuid: string;
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
  };
  account: {
    uuid: string;
    username: string;
    email: string;
    displayName: string;
  };
  message: string;
}

/**
 * Authentication Application Service
 * 负责认证流程的核心业务逻辑编排
 */
export class AuthenticationApplicationService {
  private credentialRepository: IAuthCredentialRepository;
  private sessionRepository: IAuthSessionRepository;
  private accountRepository: IAccountRepository;
  private authenticationDomainService: AuthenticationDomainService;
  private jwtSecret: string;

  constructor(
    credentialRepository: IAuthCredentialRepository,
    sessionRepository: IAuthSessionRepository,
    accountRepository: IAccountRepository,
    jwtSecret: string = process.env.JWT_SECRET || 'default-secret-change-in-production',
  ) {
    this.credentialRepository = credentialRepository;
    this.sessionRepository = sessionRepository;
    this.accountRepository = accountRepository;
    this.authenticationDomainService = new AuthenticationDomainService();
    this.jwtSecret = jwtSecret;
  }

  /**
   * 用户登录主流程
   *
   * 步骤：
   * 1. 查询账户（通过用户名）
   * 2. 查询凭证（通过 accountUuid）
   * 3. 检查凭证是否锁定（调用 DomainService）
   * 4. 验证密码（调用 DomainService）
   * 5. 生成访问令牌和刷新令牌
   * 6. 创建会话（调用 DomainService）
   * 7. 持久化会话
   * 8. 重置失败尝试次数
   * 9. 发布登录成功事件
   * 10. 返回登录响应
   */
  async login(request: LoginRequest): Promise<LoginResponse> {
    logger.info('[AuthenticationApplicationService] Starting login', {
      identifier: request.identifier,
      deviceType: request.deviceInfo.deviceType,
    });

    try {
      // ===== 步骤 1: 查询账户（支持用户名或邮箱） =====
      // 判断 identifier 是邮箱还是用户名
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(request.identifier);
      const account = isEmail
        ? await this.accountRepository.findByEmail(request.identifier)
        : await this.accountRepository.findByUsername(request.identifier);

      if (!account) {
        throw new Error('Invalid username or password');
      }

      // ===== 步骤 2: 查询凭证 =====
      const credential = await this.credentialRepository.findByAccountUuid(account.uuid);
      if (!credential) {
        throw new Error('Invalid username or password');
      }

      // ===== 步骤 3: 检查凭证是否锁定 =====
      const isLocked = this.authenticationDomainService.isCredentialLocked(credential);
      if (isLocked) {
        throw new Error('Account is locked due to too many failed login attempts');
      }

      // ===== 步骤 4: 验证密码 =====
      // 使用 bcrypt.compare 比较明文密码和哈希密码
      const isPasswordValid = await bcrypt.compare(
        request.password,
        credential.passwordCredential?.hashedPassword || '',
      );

      if (!isPasswordValid) {
        // 记录失败登录
        await this.recordFailedLogin(account.uuid);
        throw new Error('Invalid username or password');
      }

      // ===== 步骤 5: 生成令牌 =====
      const { accessToken, refreshToken, expiresAt } = this.generateTokens(account.uuid);

      // ===== 步骤 6: 创建会话 =====
      const session = await this.createSession({
        accountUuid: account.uuid,
        accessToken,
        refreshToken,
        deviceInfo: request.deviceInfo,
        ipAddress: request.ipAddress,
        location: request.location,
      });

      // ===== 步骤 7: 重置失败尝试次数 =====
      await this.resetFailedAttempts(account.uuid);

      // ===== 步骤 8: 发布登录成功事件 =====
      await this.publishLoginSuccessEvent(account, session);

      logger.info('[AuthenticationApplicationService] Login successful', {
        accountUuid: account.uuid,
        identifier: request.identifier,
      });

      return {
        success: true,
        session: {
          sessionUuid: session.uuid,
          accessToken,
          refreshToken,
          expiresAt,
        },
        account: {
          uuid: account.uuid,
          username: account.username,
          email: account.email,
          displayName: account.profile?.displayName || account.username,
        },
        message: 'Login successful',
      };
    } catch (error) {
      logger.error('[AuthenticationApplicationService] Login failed', {
        identifier: request.identifier,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * 创建会话
   *
   * 步骤：
   * 1. 调用 DomainService 创建会话聚合根（不持久化）
   * 2. ApplicationService 持久化会话
   * 3. 发布会话创建事件
   */
  async createSession(params: {
    accountUuid: string;
    accessToken: string;
    refreshToken: string;
    deviceInfo: any;
    ipAddress: string;
    location?: any;
  }): Promise<AuthSession> {
    logger.debug('[AuthenticationApplicationService] Creating session', {
      accountUuid: params.accountUuid,
    });

    try {
      // ===== 步骤 1: 调用 DomainService 创建会话聚合根 =====
      const session = this.authenticationDomainService.createSession({
        accountUuid: params.accountUuid,
        accessToken: params.accessToken,
        refreshToken: params.refreshToken,
        device: params.deviceInfo,
        ipAddress: params.ipAddress,
        location: params.location,
      });

      logger.debug('[AuthenticationApplicationService] Session aggregate created', {
        sessionUuid: session.uuid,
      });

      // ===== 步骤 2: ApplicationService 持久化会话 =====
      await this.sessionRepository.save(session);

      logger.info('[AuthenticationApplicationService] Session persisted successfully', {
        sessionUuid: session.uuid,
      });

      // ===== 步骤 3: 发布会话创建事件 =====
      await this.publishSessionCreatedEvent(session);

      return session;
    } catch (error) {
      logger.error('[AuthenticationApplicationService] Session creation failed', {
        accountUuid: params.accountUuid,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * 记录失败登录
   *
   * 步骤：
   * 1. 查询凭证
   * 2. 调用聚合根方法记录失败登录
   * 3. 持久化
   * 4. 发布失败登录事件
   */
  async recordFailedLogin(accountUuid: string): Promise<void> {
    logger.debug('[AuthenticationApplicationService] Recording failed login', {
      accountUuid,
    });

    try {
      // ===== 步骤 1: 查询凭证 =====
      const credential = await this.credentialRepository.findByAccountUuid(accountUuid);
      if (!credential) {
        throw new Error('Credential not found');
      }

      // ===== 步骤 2: 调用聚合根方法记录失败登录 =====
      credential.recordFailedLogin();

      // ===== 步骤 3: 持久化 =====
      await this.credentialRepository.save(credential);

      logger.info('[AuthenticationApplicationService] Failed login recorded', {
        accountUuid,
        failedAttempts: credential.security.failedLoginAttempts,
      });

      // ===== 步骤 4: 发布失败登录事件 =====
      await this.publishFailedLoginEvent(accountUuid, credential);
    } catch (error) {
      logger.error('[AuthenticationApplicationService] Failed to record failed login', {
        accountUuid,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * 重置失败尝试次数
   *
   * 步骤：
   * 1. 查询凭证
   * 2. 调用聚合根方法重置失败尝试次数
   * 3. 持久化
   */
  async resetFailedAttempts(accountUuid: string): Promise<void> {
    logger.debug('[AuthenticationApplicationService] Resetting failed attempts', {
      accountUuid,
    });

    try {
      // ===== 步骤 1: 查询凭证 =====
      const credential = await this.credentialRepository.findByAccountUuid(accountUuid);
      if (!credential) {
        throw new Error('Credential not found');
      }

      // ===== 步骤 2: 调用聚合根方法重置失败尝试次数 =====
      credential.resetFailedAttempts();

      // ===== 步骤 3: 持久化 =====
      await this.credentialRepository.save(credential);

      logger.info('[AuthenticationApplicationService] Failed attempts reset', {
        accountUuid,
      });
    } catch (error) {
      logger.error('[AuthenticationApplicationService] Failed to reset failed attempts', {
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

    // Generate JWT refresh token (longer expiry, different payload)
    const refreshToken = jwt.sign(
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
        expiresIn: refreshTokenExpiresIn,
      },
    );

    return { accessToken, refreshToken, expiresAt };
  }

  /**
   * 发布登录成功事件
   */
  private async publishLoginSuccessEvent(account: Account, session: AuthSession): Promise<void> {
    eventBus.publish({
      eventType: 'authentication:login_success',
      payload: {
        accountUuid: account.uuid,
        username: account.username,
        sessionUuid: session.uuid,
        deviceType: session.device.deviceType,
        ipAddress: session.ipAddress,
      },
      timestamp: Date.now(),
      aggregateId: account.uuid,
      occurredOn: new Date(),
    });

    logger.debug('[AuthenticationApplicationService] Login success event published', {
      accountUuid: account.uuid,
    });
  }

  /**
   * 发布会话创建事件
   */
  private async publishSessionCreatedEvent(session: AuthSession): Promise<void> {
    eventBus.publish({
      eventType: 'authentication:session_created',
      payload: {
        sessionUuid: session.uuid,
        accountUuid: session.accountUuid,
        deviceType: session.device.deviceType,
      },
      timestamp: Date.now(),
      aggregateId: session.uuid,
      occurredOn: new Date(),
    });

    logger.debug('[AuthenticationApplicationService] Session created event published', {
      sessionUuid: session.uuid,
    });
  }

  /**
   * 发布失败登录事件
   */
  private async publishFailedLoginEvent(
    accountUuid: string,
    credential: AuthCredential,
  ): Promise<void> {
    eventBus.publish({
      eventType: 'authentication:login_failed',
      payload: {
        accountUuid,
        failedAttempts: credential.security.failedLoginAttempts,
        isLocked: credential.isLocked(),
      },
      timestamp: Date.now(),
      aggregateId: accountUuid,
      occurredOn: new Date(),
    });

    logger.debug('[AuthenticationApplicationService] Failed login event published', {
      accountUuid,
    });
  }

  /**
   * 用户登出（单设备）
   *
   * 步骤：
   * 1. 通过 accessToken 查询会话
   * 2. 检查会话状态
   * 3. 调用聚合根方法注销会话
   * 4. 持久化会话
   * 5. 发布登出事件
   */
  async logout(params: { accessToken: string }): Promise<{ success: boolean; message: string }> {
    logger.info('[AuthenticationApplicationService] Starting logout', {
      accessToken: params.accessToken.substring(0, 20) + '...',
    });

    try {
      // ===== 步骤 1: 查询会话 =====
      const session = await this.sessionRepository.findByAccessToken(params.accessToken);
      if (!session) {
        throw new Error('Session not found or already logged out');
      }

      // ===== 步骤 2: 检查会话状态 =====
      if (session.status === 'REVOKED') {
        logger.warn('[AuthenticationApplicationService] Session already revoked', {
          sessionUuid: session.uuid,
        });
        return {
          success: true,
          message: 'Already logged out',
        };
      }

      // ===== 步骤 3: 调用聚合根方法注销会话 =====
      session.revoke();

      // ===== 步骤 4: 持久化会话 =====
      await this.sessionRepository.save(session);

      logger.info('[AuthenticationApplicationService] Session revoked successfully', {
        sessionUuid: session.uuid,
        accountUuid: session.accountUuid,
      });

      // ===== 步骤 5: 发布登出事件 =====
      await this.publishLogoutEvent(session);

      return {
        success: true,
        message: 'Logout successful',
      };
    } catch (error) {
      logger.error('[AuthenticationApplicationService] Logout failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * 用户登出（全设备）
   *
   * 步骤：
   * 1. 验证当前 accessToken
   * 2. 查询账户所有活跃会话
   * 3. 批量注销所有会话
   * 4. 持久化所有会话
   * 5. 发布全设备登出事件
   */
  async logoutAll(params: {
    accountUuid: string;
    accessToken: string;
  }): Promise<{ success: boolean; message: string; revokedSessionsCount: number }> {
    logger.info('[AuthenticationApplicationService] Starting logout all', {
      accountUuid: params.accountUuid,
    });

    try {
      // ===== 步骤 1: 验证当前会话 =====
      const currentSession = await this.sessionRepository.findByAccessToken(params.accessToken);
      if (!currentSession) {
        throw new Error('Current session not found');
      }

      if (currentSession.accountUuid !== params.accountUuid) {
        throw new Error('Access token does not belong to this account');
      }

      // ===== 步骤 2: 查询账户所有活跃会话 =====
      const sessions = await this.sessionRepository.findActiveSessionsByAccountUuid(
        params.accountUuid,
      );

      if (sessions.length === 0) {
        logger.warn('[AuthenticationApplicationService] No active sessions found', {
          accountUuid: params.accountUuid,
        });
        return {
          success: true,
          message: 'No active sessions to revoke',
          revokedSessionsCount: 0,
        };
      }

      // ===== 步骤 3: 批量注销所有会话 =====
      sessions.forEach((session) => {
        session.revoke();
      });

      // ===== 步骤 4: 持久化所有会话 =====
      await Promise.all(sessions.map((session) => this.sessionRepository.save(session)));

      logger.info('[AuthenticationApplicationService] All sessions revoked successfully', {
        accountUuid: params.accountUuid,
        revokedCount: sessions.length,
      });

      // ===== 步骤 5: 发布全设备登出事件 =====
      await this.publishLogoutAllEvent(params.accountUuid, sessions.length);

      return {
        success: true,
        message: `Successfully logged out from ${sessions.length} device(s)`,
        revokedSessionsCount: sessions.length,
      };
    } catch (error) {
      logger.error('[AuthenticationApplicationService] Logout all failed', {
        accountUuid: params.accountUuid,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * 发布登出事件
   */
  private async publishLogoutEvent(session: AuthSession): Promise<void> {
    eventBus.publish({
      eventType: 'authentication:logout',
      payload: {
        accountUuid: session.accountUuid,
        sessionUuid: session.uuid,
        deviceType: session.device.deviceType,
        ipAddress: session.ipAddress,
        revokedAt: session.revokedAt,
      },
      timestamp: Date.now(),
      aggregateId: session.accountUuid,
      occurredOn: new Date(),
    });

    logger.debug('[AuthenticationApplicationService] Logout event published', {
      sessionUuid: session.uuid,
    });
  }

  /**
   * 发布全设备登出事件
   */
  private async publishLogoutAllEvent(accountUuid: string, revokedCount: number): Promise<void> {
    eventBus.publish({
      eventType: 'authentication:logout_all',
      payload: {
        accountUuid,
        revokedSessionsCount: revokedCount,
      },
      timestamp: Date.now(),
      aggregateId: accountUuid,
      occurredOn: new Date(),
    });

    logger.debug('[AuthenticationApplicationService] Logout all event published', {
      accountUuid,
      revokedCount,
    });
  }
}
