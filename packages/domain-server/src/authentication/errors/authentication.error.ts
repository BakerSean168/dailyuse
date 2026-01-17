/**
 * Authentication Domain Errors
 * 认证模块领域错误定义
 */

/**
 * 认证错误基类
 */
export abstract class AuthenticationError extends Error {
  public readonly name: string;
  public readonly statusCode: number;

  constructor(message: string, name: string, statusCode: number = 400) {
    super(message);
    this.name = name;
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

/**
 * 无效凭证错误 - 用户名、密码、或 API Key 无效
 */
export class InvalidCredentialsError extends AuthenticationError {
  constructor(message: string = 'Invalid username, email, or password') {
    super(message, 'InvalidCredentialsError', 401);
    Object.setPrototypeOf(this, InvalidCredentialsError.prototype);
  }
}

/**
 * 令牌过期错误
 */
export class TokenExpiredError extends AuthenticationError {
  public readonly expiresAt: number;

  constructor(message: string = 'Token has expired', expiresAt?: number) {
    super(message, 'TokenExpiredError', 401);
    this.expiresAt = expiresAt ?? Date.now();
    Object.setPrototypeOf(this, TokenExpiredError.prototype);
  }
}

/**
 * 凭证锁定错误 - 过多失败登录尝试
 */
export class CredentialLockedError extends AuthenticationError {
  public readonly lockedUntil: number;
  public readonly failedAttempts: number;

  constructor(
    message: string = 'Account is locked due to too many failed login attempts',
    lockedUntil?: number,
    failedAttempts: number = 0,
  ) {
    super(message, 'CredentialLockedError', 403);
    this.lockedUntil = lockedUntil ?? Date.now() + 30 * 60 * 1000; // 30 minutes
    this.failedAttempts = failedAttempts;
    Object.setPrototypeOf(this, CredentialLockedError.prototype);
  }
}

/**
 * 无效签名错误 - JWT 验证失败
 */
export class InvalidSignatureError extends AuthenticationError {
  constructor(message: string = 'Token has invalid signature') {
    super(message, 'InvalidSignatureError', 401);
    Object.setPrototypeOf(this, InvalidSignatureError.prototype);
  }
}

/**
 * 会话已撤销错误
 */
export class SessionRevokedError extends AuthenticationError {
  public readonly revokedAt: number;

  constructor(message: string = 'Session has been revoked', revokedAt?: number) {
    super(message, 'SessionRevokedError', 401);
    this.revokedAt = revokedAt ?? Date.now();
    Object.setPrototypeOf(this, SessionRevokedError.prototype);
  }
}

/**
 * 会话无效错误
 */
export class InvalidSessionError extends AuthenticationError {
  constructor(message: string = 'Session is invalid or expired') {
    super(message, 'InvalidSessionError', 401);
    Object.setPrototypeOf(this, InvalidSessionError.prototype);
  }
}

/**
 * 身份验证失败错误（通用）
 */
export class AuthenticationFailedError extends AuthenticationError {
  constructor(message: string = 'Authentication failed') {
    super(message, 'AuthenticationFailedError', 401);
    Object.setPrototypeOf(this, AuthenticationFailedError.prototype);
  }
}

/**
 * 双因素认证错误
 */
export class TwoFactorAuthenticationError extends AuthenticationError {
  constructor(message: string = 'Two factor authentication failed') {
    super(message, 'TwoFactorAuthenticationError', 401);
    Object.setPrototypeOf(this, TwoFactorAuthenticationError.prototype);
  }
}

/**
 * 密码强度不足错误
 */
export class WeakPasswordError extends AuthenticationError {
  public readonly requirements: string[];

  constructor(message: string = 'Password does not meet strength requirements', requirements: string[] = []) {
    super(message, 'WeakPasswordError', 400);
    this.requirements = requirements;
    Object.setPrototypeOf(this, WeakPasswordError.prototype);
  }
}
