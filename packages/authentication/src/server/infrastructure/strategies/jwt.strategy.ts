/**
 * JWT Authentication Strategy
 *
 * Passport strategy for validating JWT tokens.
 * Used by Express authentication middleware.
 */

import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import type { StrategyOptions, VerifiedCallback } from 'passport-jwt';
import type { IAuthIdentityRepository, IAuthSessionRepository } from '../../domain';
import { IdentityId } from '@memoflow/domain-shared/shared';
import { AuthSessionId } from '../../domain';

export interface JwtStrategyConfig {
  jwtSecret: string;
  identityRepository: IAuthIdentityRepository;
  sessionRepository: IAuthSessionRepository;
}

/**
 * Create JWT Strategy for Passport
 *
 * Validates JWT access tokens and loads the associated identity/session.
 */
export function createJwtStrategy(config: JwtStrategyConfig): JwtStrategy {
  const { jwtSecret, identityRepository, sessionRepository } = config;

  const options: StrategyOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: jwtSecret,
    ignoreExpiration: false,
  };

  return new JwtStrategy(options, async (payload: Record<string, unknown>, done: VerifiedCallback) => {
    try {
      // Verify identity exists
      const identity = await identityRepository.findById(IdentityId.of(payload.identityId as string));
      if (!identity) {
        return done(null, false, { message: 'Identity not found' });
      }

      // Optionally verify session
      if (payload.sessionId) {
        const session = await sessionRepository.findById(AuthSessionId.of(payload.sessionId as string));
        if (!session || !session.isValid()) {
          return done(null, false, { message: 'Session is not active' });
        }
      }

      return done(null, {
        identityId: identity.id,
        sessionId: payload.sessionId,
      });
    } catch (err) {
      return done(err instanceof Error ? err : new Error(String(err)), false);
    }
  });
}
