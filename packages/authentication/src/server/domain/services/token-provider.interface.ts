import type { Result } from '@memoflow/contracts/result';

// 1. Standard structure for token payloads
// The domain layer defines what information a token must contain (e.g. userId, role)
export interface AccessTokenPayload {
  identityId: string; // Subject (typically the user ID)
  role?: string;
  sessionId: string; // Include sessionId for session correlation
}

export interface RefreshTokenPayload {
  identityId: string;
  sessionId: string; // Refresh token must be bound to a session
  // jti?: string;   // Optional: JWT ID for replay prevention
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // Access token expiration time in seconds (per OAuth2 standard)
}

// 2. Token provider interface
export interface ITokenProvider {
  /** Generates a short-lived access token. */
  generateAccessToken(payload: AccessTokenPayload): string;

  /** Generates a long-lived refresh token. */
  generateRefreshToken(payload: RefreshTokenPayload): string;

  /** Verifies a token and parses its payload. */
  verifyAccessToken(token: string): Result<AccessTokenPayload>;

  /** Verifies a refresh token. */
  verifyRefreshToken(token: string): Result<RefreshTokenPayload>;

  /** Convenience method for generating a token pair. */
  generateAuthTokens(payload: { identityId: string; sessionId: string }): AuthTokens;

  /**
   * Hashes a token (for storing refresh token hashes).
   * @param token - The plaintext token
   * @returns The hash value
   */
  hash(token: string): string;
}
