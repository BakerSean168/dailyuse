import jwt from 'jsonwebtoken';
import * as crypto from 'crypto';
import type { ITokenProvider, AccessTokenPayload, RefreshTokenPayload, AuthTokens } from '@/domain-server/services/token-provider.interface';
import { type Result, ok, fail, ResultCode } from '@dailyuse/contracts/result';

export class JwtTokenProvider implements ITokenProvider {
  constructor(
    // 这些配置通常从环境变量或 ConfigService 获取
    private readonly accessSecret: string,
    private readonly refreshSecret: string,
    private readonly accessExpiresInMs: number, // Access Token 有效期（毫秒�?
    private readonly refreshExpiresInMs: number // Refresh Token 有效期（毫秒�?
  ) {}

  generateAccessToken(payload: AccessTokenPayload): string {
    // 将毫秒转换为秒数（jwt.sign �?expiresIn 使用数字时单位是秒）
    const expiresInSeconds = Math.floor(this.accessExpiresInMs / 1000);
    
    return jwt.sign(payload, this.accessSecret, {
      expiresIn: expiresInSeconds,
      algorithm: 'HS256', // �?RS256
    } as jwt.SignOptions);
  }

  generateRefreshToken(payload: RefreshTokenPayload): string {
    // 将毫秒转换为秒数（jwt.sign �?expiresIn 使用数字时单位是秒）
    const expiresInSeconds = Math.floor(this.refreshExpiresInMs / 1000);
    
    return jwt.sign(payload, this.refreshSecret, {
      expiresIn: expiresInSeconds,
      algorithm: 'HS256',
    } as jwt.SignOptions);
  }

  generateAuthTokens(data: { identityId: string; sessionId: string }): AuthTokens {
    const accessToken = this.generateAccessToken({
      identityId: data.identityId,
      sessionId: data.sessionId
    });

    const refreshToken = this.generateRefreshToken({
      identityId: data.identityId,
      sessionId: data.sessionId
    });

    // �?返回秒数，符�?OAuth2 标准（前端通常�?* 1000 来设置定时器�?
    const expiresIn = Math.floor(this.accessExpiresInMs / 1000);

    return { accessToken, refreshToken, expiresIn };
  }

  verifyAccessToken(token: string): Result<AccessTokenPayload> {
    try {
      const decoded = jwt.verify(token, this.accessSecret) as AccessTokenPayload;
      return ok(decoded);
    } catch (error) {
      return fail({ code: ResultCode.UNAUTHORIZED, message: 'Invalid or expired access token' });
    }
  }

  verifyRefreshToken(token: string): Result<RefreshTokenPayload> {
    try {
      const decoded = jwt.verify(token, this.refreshSecret) as RefreshTokenPayload;
      return ok(decoded);
    } catch (error) {
      return fail({ code: ResultCode.UNAUTHORIZED, message: 'Invalid or expired refresh token' });
    }
  }

  /**
   * �?新增：哈希方�?
   * 用于�?Refresh Token 转换为哈希值存入数据库
   */
  hash(token: string): string {
    return crypto
      .createHash('sha256') // 使用 SHA-256 算法
      .update(token)
      .digest('hex');       // 输出为十六进制字符串
  }
}