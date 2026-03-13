import jwt from 'jsonwebtoken';
import * as crypto from 'crypto';
import type {
  ITokenProvider,
  AccessTokenPayload,
  RefreshTokenPayload,
  AuthTokens,
} from '@/domain-server/services/token-provider.interface';
import { type Result, ok, fail, ResultCode } from '@dailyuse/contracts/result';

export class JwtTokenProvider implements ITokenProvider {
  constructor(
    // These configs are typically obtained from environment variables or ConfigService
    private readonly accessSecret: string,
    private readonly refreshSecret: string,
    private readonly accessExpiresInMs: number, // Access token TTL (milliseconds)
    private readonly refreshExpiresInMs: number, // Refresh token TTL (milliseconds)
  ) {}

  generateAccessToken(payload: AccessTokenPayload): string {
    // Convert milliseconds to seconds (jwt.sign uses seconds when expiresIn is a number)
    const expiresInSeconds = Math.floor(this.accessExpiresInMs / 1000);

    return jwt.sign(payload, this.accessSecret, {
      expiresIn: expiresInSeconds,
      algorithm: 'HS256', // or RS256
    } as jwt.SignOptions);
  }

  generateRefreshToken(payload: RefreshTokenPayload): string {
    // Convert milliseconds to seconds (jwt.sign uses seconds when expiresIn is a number)
    const expiresInSeconds = Math.floor(this.refreshExpiresInMs / 1000);

    return jwt.sign(payload, this.refreshSecret, {
      expiresIn: expiresInSeconds,
      algorithm: 'HS256',
    } as jwt.SignOptions);
  }

  generateAuthTokens(data: { identityId: string; sessionId: string }): AuthTokens {
    const accessToken = this.generateAccessToken({
      identityId: data.identityId,
      sessionId: data.sessionId,
    });

    const refreshToken = this.generateRefreshToken({
      identityId: data.identityId,
      sessionId: data.sessionId,
    });

    // Return seconds per OAuth2 standard (clients typically multiply by 1000 for timers)
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
   * Hashes a refresh token for database storage.
   */
  hash(token: string): string {
    return crypto
      .createHash('sha256') // Use SHA-256 algorithm
      .update(token)
      .digest('hex'); // Output as hexadecimal string
  }
}
