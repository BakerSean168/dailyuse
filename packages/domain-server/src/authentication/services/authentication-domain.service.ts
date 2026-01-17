/**
 * Authentication 领域服务
 *
 * DDD 领域服务职责（最佳实践）：
 * - 创建聚合根（AuthCredential、AuthSession）
 * - 复杂的业务规则验证（密码强度、锁定策略等）
 * - 跨聚合根的业务协调（但不持久化）
 * - 只返回聚合根对象，不调用 Repository
 *
 * ⚠️ 重要变更：
 * - 不再注入 Repository
 * - 不再调用 repository.save() 或 repository.find()
 * - 持久化和查询由 ApplicationService 负责
 */

import { AuthCredential } from '../aggregates/auth-credential';
import { AuthSession } from '../aggregates/auth-session';
import { DeviceInfo } from '../value-objects/device-info';

export class AuthenticationDomainService {
  // ✅ 不再注入 Repository

  /**
   * 创建密码凭证（不持久化）
   *
   * @returns 返回 AuthCredential 聚合根对象
   */
  public createPasswordCredential(params: {
    accountUuid: string;
    hashedPassword: string;
  }): AuthCredential {
    // 业务规则验证
    this.validatePasswordCredentialCreation(params);

    // 创建聚合根
    const credential = AuthCredential.create({
      accountUuid: params.accountUuid,
      type: 'PASSWORD',
      hashedPassword: params.hashedPassword,
    });

    // 只返回聚合根，不持久化
    return credential;
  }

  /**
   * 验证密码凭证创建的业务规则
   */
  private validatePasswordCredentialCreation(params: {
    accountUuid: string;
    hashedPassword: string;
  }): void {
    if (!params.accountUuid) {
      throw new Error('Account UUID is required');
    }
    if (!params.hashedPassword) {
      throw new Error('Hashed password is required');
    }
    // 注意：唯一性检查由 ApplicationService 负责
  }

  /**
   * 创建会话（不持久化）
   *
   * @returns 返回 AuthSession 聚合根对象
   */
  public createSession(params: {
    accountUuid: string;
    accessToken: string;
    refreshToken: string;
    device: DeviceInfo;
    ipAddress: string;
    location?: {
      country?: string;
      region?: string;
      city?: string;
      timezone?: string;
    };
  }): AuthSession {
    // 业务规则验证
    this.validateSessionCreation(params);

    // 创建聚合根
    const session = AuthSession.create({
      accountUuid: params.accountUuid,
      accessToken: params.accessToken,
      refreshToken: params.refreshToken,
      device: params.device as any,
      ipAddress: params.ipAddress,
      location: params.location,
    });

    // 只返回聚合根，不持久化
    return session;
  }

  /**
   * 验证会话创建的业务规则
   */
  private validateSessionCreation(params: {
    accountUuid: string;
    accessToken: string;
    refreshToken: string;
    device: DeviceInfo;
    ipAddress: string;
  }): void {
    if (!params.accountUuid) {
      throw new Error('Account UUID is required');
    }
    if (!params.accessToken) {
      throw new Error('Access token is required');
    }
    if (!params.refreshToken) {
      throw new Error('Refresh token is required');
    }
    if (!params.device) {
      throw new Error('Device info is required');
    }
    if (!params.ipAddress) {
      throw new Error('IP address is required');
    }
  }

  /**
   * 业务规则：验证密码（使用已有的凭证对象）
   *
   * @param credential 已查询的凭证对象（由 ApplicationService 查询）
   * @param hashedPassword 待验证的哈希密码
   */
  public verifyPassword(credential: AuthCredential, hashedPassword: string): boolean {
    if (!credential) {
      return false;
    }
    return credential.verifyPassword(hashedPassword);
  }

  /**
   * 业务规则：检查凭证是否锁定
   *
   * @param credential 已查询的凭证对象（由 ApplicationService 查询）
   */
  public isCredentialLocked(credential: AuthCredential | null): boolean {
    if (!credential) {
      return false;
    }
    return credential.isLocked();
  }

  /**
   * 业务规则：验证会话
   *
   * @param session 已查询的会话对象（由 ApplicationService 查询）
   */
  public validateSession(session: AuthSession | null): boolean {
    if (!session) {
      return false;
    }
    return session.isValid();
  }

  /**
   * 业务规则：验证双因素代码
   *
   * @param credential 已查询的凭证对象（由 ApplicationService 查询）
   * @param code 双因素代码
   */
  public verifyTwoFactorCode(credential: AuthCredential, code: string): boolean {
    if (!credential) {
      return false;
    }
    return credential.verifyTwoFactorCode(code);
  }

  /**
   * 业务规则：验证记住我令牌
   *
   * @param credential 已查询的凭证对象（由 ApplicationService 查询）
   * @param token 令牌
   * @param deviceFingerprint 设备指纹
   */
  public verifyRememberMeToken(
    credential: AuthCredential,
    token: string,
    deviceFingerprint: string,
  ): boolean {
    if (!credential) {
      return false;
    }
    const verifiedToken = credential.verifyRememberMeToken(token, deviceFingerprint);
    return verifiedToken !== null;
  }

  /**
   * 业务规则：密码强度验证
   */
  public validatePasswordStrength(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (password.length > 128) {
      errors.push('Password must not exceed 128 characters');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one digit');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * 业务规则：锁定策略验证
   */
  public shouldLockCredential(failedAttempts: number): boolean {
    const MAX_FAILED_ATTEMPTS = 5;
    return failedAttempts >= MAX_FAILED_ATTEMPTS;
  }

  /**
   * 业务规则：会话过期策略
   */
  public shouldExtendSession(lastActivityAt: Date): boolean {
    const INACTIVITY_THRESHOLD_MINUTES = 30;
    const now = new Date();
    const minutesSinceLastActivity = (now.getTime() - lastActivityAt.getTime()) / (1000 * 60);

    return minutesSinceLastActivity < INACTIVITY_THRESHOLD_MINUTES;
  }

  /**
   * 业务规则：刷新令牌有效期
   */
  public isRefreshTokenExpired(expiresAt: Date): boolean {
    return expiresAt < new Date();
  }

  /**
   * 业务规则：检查是否需要双因素认证
   */
  public requiresTwoFactor(credential: AuthCredential): boolean {
    if (!credential) {
      return false;
    }
    return credential.twoFactor?.enabled ?? false;
  }
}
