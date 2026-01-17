/**
 * JWT Authentication Strategy
 *
 * Passport strategy for validating JWT tokens.
 * Used by Express authentication middleware.
 */

import { Strategy as JwtStrategy, ExtractJwt, StrategyOptions } from 'passport-jwt';
import type { IAuthCredentialRepository } from '../ports/auth-credential-repository.port';
import type { IAuthSessionRepository } from '../ports/auth-session-repository.port';
import type { JwtPayloadDTO } from '@dailyuse/contracts/authentication';

export interface JwtStrategyConfig {
  jwtSecret: string;
  credentialRepository: IAuthCredentialRepository;
  sessionRepository: IAuthSessionRepository;
}

/**
 * Create JWT Strategy for Passport
 *
 * Validates JWT access tokens and loads the associated credential/session.
 * 
 * @example
 * ```ts
 * import passport from 'passport';
 * import { createJwtStrategy } from '@dailyuse/infrastructure-server/authentication';
 * 
 * passport.use('jwt', createJwtStrategy({
 *   jwtSecret: process.env.JWT_SECRET,
 *   credentialRepository,
 *   sessionRepository,
 * }));
 * ```
 */
export function createJwtStrategy(config: JwtStrategyConfig): JwtStrategy {
  const { jwtSecret, credentialRepository, sessionRepository } = config;

  const options: StrategyOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: jwtSecret,
    ignoreExpiration: false,
  };

  return new JwtStrategy(options, async (payload: JwtPayloadDTO, done) => {
    try {
      // Verify session is still active
      const session = await sessionRepository.findByUuid(payload.sessionUuid);
      if (!session || session.status !== 'ACTIVE') {
        return done(null, false, { message: 'Session is not active' });
      }

      // Verify credential exists and is active
      const credential = await credentialRepository.findByAccountUuid(payload.accountUuid);
      if (!credential || credential.status !== 'ACTIVE') {
        return done(null, false, { message: 'Credential is not active' });
      }

      // Return user context
      return done(null, {
        accountUuid: payload.accountUuid,
        sessionUuid: payload.sessionUuid,
      });
    } catch (error) {
      return done(error, false);
    }
  });
}
