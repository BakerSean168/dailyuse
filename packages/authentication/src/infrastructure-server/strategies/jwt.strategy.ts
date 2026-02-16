/**
 * JWT Authentication Strategy
 *
 * Passport strategy for validating JWT tokens.
 * Used by Express authentication middleware.
 */

import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import type { StrategyOptions } from 'passport-jwt';
import type { IAuthIdentityRepository, IAuthSessionRepository } from '../../domain-server';

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

  return new JwtStrategy(options, async (payload: any, done: any) => {
    try {
      // Verify identity exists
      const identity = await identityRepository.findById(payload.identityId || payload.identityId);
      if (!identity) {
        return done(null, false, { message: 'Identity not found' });
      }

      // Optionally verify session
      if (payload.sessionId) {
        const session = await sessionRepository.findById(payload.sessionId);
        if (!session || !session.isValid()) {
          return done(null, false, { message: 'Session is not active' });
        }
      }

      return done(null, {
        identityId: identity.id,
        sessionId: payload.sessionId,
      });
    } catch (error) {
      return done(error, false);
    }
  });
}
