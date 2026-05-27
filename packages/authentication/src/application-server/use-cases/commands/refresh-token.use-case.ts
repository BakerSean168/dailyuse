/**
 * Refresh Token Use Case
 *
 * Application use case for refreshing access tokens.
 */

import type { Result } from '@dailyuse/contracts/result';
import { ok, error, unwrapOrThrowError } from '@dailyuse/contracts/result';
import {
  type IAuthIdentityRepository,
  type IAuthSessionRepository,
  type ITokenProvider,
} from '../../../domain-server';
import type { RefreshTokenReq, RefreshTokenRes } from '@dailyuse/contracts/authentication';
import type { ExecutionContext } from '@dailyuse/contracts/shared';
import { AuthSessionId } from '../../../domain-shared';
import { createLogger } from '@dailyuse/utils/logger';

const logger = createLogger('RefreshToken');

/**
 * Refresh Token Use Case
 */
export class RefreshTokenUseCase {
  constructor(
    private readonly sessionRepository: IAuthSessionRepository,
    private readonly identityRepository: IAuthIdentityRepository,
    private readonly tokenProvider: ITokenProvider,
  ) {}

  /**
   * Execute token refresh.
   */
  async execute(input: RefreshTokenReq, cx: ExecutionContext): Promise<Result<RefreshTokenRes>> {
    logger.info('[RefreshToken] Starting token refresh', { identityId: cx.identityId });

    // 1. Verify refresh token and parse payload
    const verifyResult = this.tokenProvider.verifyRefreshToken(input.refreshToken);
    let tokenIdentityId: any;
    let tokenSessionId: any;
    try {
      ({ identityId: tokenIdentityId, sessionId: tokenSessionId } =
        unwrapOrThrowError(verifyResult));
    } catch {
      return error('UNAUTHORIZED', 'Invalid refresh token or session expired');
    }

    // 2. Find and validate session
    const session = await this.sessionRepository.findById(AuthSessionId.of(tokenSessionId));
    const refreshTokenHash = this.tokenProvider.hash(input.refreshToken);

    if (!session || !session.isValid() || session.refreshTokenHash !== refreshTokenHash) {
      return error('UNAUTHORIZED', 'Invalid refresh token or session expired');
    }

    if (String(session.identityId) !== String(tokenIdentityId)) {
      return error('UNAUTHORIZED', 'Refresh token does not match session identity');
    }

    // 3. Update session activity (sliding window)
    session.touch();

    // 4. Generate new token pair
    const tokens = this.tokenProvider.generateAuthTokens({
      identityId: session.identityId,
      sessionId: session.id,
    });

    // 5. Update session refresh token hash
    session.updateRefreshTokenHash(this.tokenProvider.hash(tokens.refreshToken));

    // 6. Save session (repository dispatches domain events automatically)
    await this.sessionRepository.save(session);

    // 7. Query identity
    const identity = await this.identityRepository.findById(session.identityId);
    if (!identity) {
      return error('NOT_FOUND', 'Identity not found');
    }

    logger.info('[RefreshToken] Token refresh successful', {
      identityId: tokenIdentityId,
      sessionId: session.id,
    });

    const sessionDto = session.toClientDTO(true);

    // 8. Return AuthResponse
    return ok({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      identity: identity.toClientDTO(),
      session: sessionDto,
    });
  }
}
