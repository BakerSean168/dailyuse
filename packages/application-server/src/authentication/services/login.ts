/**
 * Login Service
 *
 * 用户登录应用服务
 * 
 * 提供两种接口：
 * - execute(): 用于 Desktop 客户端（返回 tokens + user）
 * - executeForWeb(): 用于 Web API（返回 session + account + message）
 */

import type { IAuthCredentialRepository, IAuthSessionRepository } from '@dailyuse/domain-server/authentication';
import { AuthenticationDomainService, AuthSession, DeviceInfo } from '@dailyuse/domain-server/authentication';
import type { LoginRequest, AuthTokens } from '@dailyuse/contracts/authentication';
import type { Account, IAccountRepository } from '@dailyuse/domain-server/account';
import { eventBus, createLogger } from '@dailyuse/utils';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const logger = createLogger('Login');

/**
 * Login Service
 */
export class Login {
  private readonly domainService: AuthenticationDomainService;

  constructor(
    private readonly credentialRepository: IAuthCredentialRepository,
    private readonly sessionRepository: IAuthSessionRepository,
    private readonly accountRepository: IAccountRepository,
  ) {
    this.domainService = new AuthenticationDomainService();
  }



  /**
   * 执行登录 (Desktop 客户端版本)
   */
  async execute(input: LoginRequest): Promise<{ tokens: AuthTokens; user: { uuid: string; identifier: string }; requiresTwoFactor?: boolean }> {
    // 1. 验证输入
    this.validateInput(input);

    // 2. 查找凭证 (by identifier - email or username)
    const credential = await this.credentialRepository.findByAccountUuid(input.identifier);
    if (!credential) {
      throw new Error('Invalid credentials');
    }

    // 3. 验证密码（假设密码已在外部哈希）
    const isValid = this.domainService.verifyPassword(credential, input.password);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    // 4. 创建设备信息
    const deviceType = (input.deviceInfo?.deviceType || 'UNKNOWN') as 'BROWSER' | 'DESKTOP' | 'MOBILE' | 'TABLET' | 'API' | 'UNKNOWN';
    const device = DeviceInfo.create({
      deviceType,
      os: input.deviceInfo?.os,
      browser: input.deviceInfo?.browser,
      ipAddress: input.deviceInfo?.ipAddress,
    });

    // 5. 生成 token (简化版本 - 实际应使用 JWT)
    const accessToken = this.generateToken('access');
    const refreshToken = this.generateToken('refresh');

    // 6. 创建会话
    const session = this.domainService.createSession({
      accountUuid: credential.accountUuid,
      accessToken,
      refreshToken,
      device,
      ipAddress: input.deviceInfo?.ipAddress || 'unknown',
    });

    // 7. 保存会话
    await this.sessionRepository.save(session);

    // 8. 发布领域事件
    await this.publishEvents(session);

    return {
      tokens: {
        accessToken,
        refreshToken,
      },
      user: {
        uuid: credential.accountUuid,
        identifier: input.identifier,
      },
    };
  }

  /**
   * 执行登录 (Web API 版本 - 从 apps/api 迁移)
   * 
   * 完整的 Web 登录流程，包含：
   * 1. 查询账户（支持用户名或邮箱）
   * 2. 查询凭证（通过 accountUuid）
   * 3. 检查凭证是否锁定
   * 4. 验证密码（使用 bcrypt）
   * 5. 生成 JWT 访问令牌和刷新令牌
   * 6. 创建会话（调用 DomainService）
   * 7. 持久化会话
   * 8. 重置失败尝试次数
   * 9. 发布登录成功事件
   * 10. 返回登录响应
   */
  async executeForWeb(request: {
    identifier: string;
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
  }): Promise<{
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
  }> {
    logger.info('[Login] Starting web login', {
      identifier: request.identifier,
      deviceType: request.deviceInfo.deviceType,
    });

    try {
      // ===== 步骤 1: 查询账户（支持用户名或邮箱） =====
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
      const isLocked = this.domainService.isCredentialLocked(credential);
      if (isLocked) {
        throw new Error('Account is locked due to too many failed login attempts');
      }

      // ===== 步骤 4: 验证密码（使用 bcrypt） =====
      const isPasswordValid = await bcrypt.compare(
        request.password,
        credential.passwordCredential?.hashedPassword || '',
      );

      if (!isPasswordValid) {
        // 记录失败登录
        await this.recordFailedLogin(account.uuid, credential);
        throw new Error('Invalid username or password');
      }

      // ===== 步骤 5: 生成 JWT 令牌 =====
      const { accessToken, refreshToken, expiresAt } = this.generateJWTTokens(account.uuid);

      // ===== 步骤 6: 创建会话 =====
      const session = await this.createSessionForWeb({
        accountUuid: account.uuid,
        accessToken,
        refreshToken,
        deviceInfo: request.deviceInfo,
        ipAddress: request.ipAddress,
        location: request.location,
      });

      // ===== 步骤 7: 重置失败尝试次数 =====
      await this.resetFailedAttempts(account.uuid, credential);

      // ===== 步骤 8: 发布登录成功事件 =====
      await this.publishLoginSuccessEvent(account, session);

      logger.info('[Login] Web login successful', {
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
      logger.error('[Login] Web login failed', {
        identifier: request.identifier,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  private validateInput(input: LoginRequest): void {
    if (!input.identifier?.trim()) {
      throw new Error('Identifier is required');
    }
    if (!input.password) {
      throw new Error('Password is required');
    }
  }

  private generateToken(type: 'access' | 'refresh'): string {
    // 简化的 token 生成 - 实际应使用 JWT
    return `${type}_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  /**
   * 生成 JWT 访问令牌和刷新令牌 (Web API 版本)
   */
  private generateJWTTokens(accountUuid: string): {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
  } {
    // TODO: 从环境变量或配置中读取 secret
    const secret = process.env.JWT_SECRET || 'your-secret-key-here-change-in-production';
    const accessTokenExpiresIn = 3600; // 1 hour in seconds
    const refreshTokenExpiresIn = 30 * 24 * 3600; // 30 days in seconds
    const expiresAt = Date.now() + accessTokenExpiresIn * 1000; // milliseconds

    const now = Math.floor(Date.now() / 1000);

    // Generate JWT access token
    const accessToken = jwt.sign(
      {
        accountUuid,
        type: 'access',
        iat: now,
        jti: crypto.randomBytes(16).toString('hex'),
        iss: 'dailyuse-api',
        aud: 'dailyuse-client',
      },
      secret,
      {
        algorithm: 'HS256',
        expiresIn: accessTokenExpiresIn,
      },
    );

    // Generate JWT refresh token
    const refreshToken = jwt.sign(
      {
        accountUuid,
        type: 'refresh',
        iat: now,
        jti: crypto.randomBytes(16).toString('hex'),
        iss: 'dailyuse-api',
        aud: 'dailyuse-client',
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
   * 创建会话 (Web API 版本)
   */
  private async createSessionForWeb(params: {
    accountUuid: string;
    accessToken: string;
    refreshToken: string;
    deviceInfo: any;
    ipAddress: string;
    location?: any;
  }): Promise<AuthSession> {
    logger.debug('[Login] Creating web session', {
      accountUuid: params.accountUuid,
    });

    // 调用 DomainService 创建会话聚合根
    const session = this.domainService.createSession({
      accountUuid: params.accountUuid,
      accessToken: params.accessToken,
      refreshToken: params.refreshToken,
      device: params.deviceInfo,
      ipAddress: params.ipAddress,
      location: params.location,
    });

    // 持久化会话
    await this.sessionRepository.save(session);

    logger.info('[Login] Web session persisted successfully', {
      sessionUuid: session.uuid,
    });

    return session;
  }

  /**
   * 记录失败登录
   */
  private async recordFailedLogin(accountUuid: string, credential: any): Promise<void> {
    logger.debug('[Login] Recording failed login', { accountUuid });

    try {
      credential.recordFailedLogin();
      await this.credentialRepository.save(credential);

      logger.info('[Login] Failed login recorded', {
        accountUuid,
        failedAttempts: credential.security.failedLoginAttempts,
      });

      // 发布失败登录事件
      await eventBus.emit('authentication:login_failed', {
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
    } catch (error) {
      logger.error('[Login] Failed to record failed login', {
        accountUuid,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * 重置失败尝试次数
   */
  private async resetFailedAttempts(accountUuid: string, credential: any): Promise<void> {
    logger.debug('[Login] Resetting failed attempts', { accountUuid });

    try {
      credential.resetFailedAttempts();
      await this.credentialRepository.save(credential);

      logger.info('[Login] Failed attempts reset', { accountUuid });
    } catch (error) {
      logger.error('[Login] Failed to reset failed attempts', {
        accountUuid,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * 发布登录成功事件 (Web API 版本)
   */
  private async publishLoginSuccessEvent(account: Account, session: AuthSession): Promise<void> {
    await eventBus.emit('authentication:login_success', {
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

    logger.debug('[Login] Login success event published', {
      accountUuid: account.uuid,
    });
  }

  private async publishEvents(session: AuthSession): Promise<void> {
    const events = session.getUncommittedDomainEvents();
    for (const event of events) {
      await eventBus.emit(event.eventType, event);
    }
  }
}
