import type { Result } from '@dailyuse/contracts/result';

// 1. 定义 Token 载荷 (Payload) 的标准结�?
// 领域层决定了 Token 里必须包含哪些信息（�?userId, role 等）
export interface AccessTokenPayload {
  identityId: string;       // Subject (通常�?User ID)
  role?: string;
  sessionId: string; // 建议放入 sessionId，方便关联会�?
}

export interface RefreshTokenPayload {
  identityId: string;
  sessionId: string; // Refresh Token 必须绑定 Session
  // jti?: string;   // 可选：JWT ID，用于防重放
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // Access Token 的过期时间（秒，符合 OAuth2 标准�?
}

// 2. 定义接口 (Interface)
export interface ITokenProvider {
  /**
   * 生成 Access Token (短效)
   */
  generateAccessToken(payload: AccessTokenPayload): string;

  /**
   * 生成 Refresh Token (长效)
   */
  generateRefreshToken(payload: RefreshTokenPayload): string;

  /**
   * 验证 Token 并解析载�?
   */
  verifyAccessToken(token: string): Result<AccessTokenPayload>;
  
  /**
   * 验证 Refresh Token
   */
  verifyRefreshToken(token: string): Result<RefreshTokenPayload>;
  
  /**
   * 生成 Token 对的快捷方法
   */
  generateAuthTokens(payload: { identityId: string; sessionId: string }): AuthTokens;

/**
 * �?Token 进行哈希处理（用于存�?Refresh Token 哈希�?
 * @param token 明文 Token
 * @returns 哈希�?
 */
  hash(token: string): string;
}