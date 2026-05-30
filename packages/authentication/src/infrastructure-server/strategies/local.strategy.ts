/**
 * Local Authentication Strategy
 *
 * Passport strategy for email/password authentication.
 * Used by login endpoints in Express applications.
 */

import { Strategy as LocalStrategy } from 'passport-local';
import type { IAuthIdentityRepository } from '../../domain-server';
import type { IPasswordHasher } from '../../domain-shared';

export interface LocalStrategyConfig {
  identityRepository: IAuthIdentityRepository;
  passwordHasher: IPasswordHasher;
}

/**
 * Create Local Strategy for Passport
 *
 * Validates email/password credentials.
 */
export function createLocalStrategy(config: LocalStrategyConfig): LocalStrategy {
  const { identityRepository, passwordHasher } = config;

  return new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
    },
    async (
      email: string,
      password: string,
      done: (err: unknown, user?: Express.User | false, options?: { message: string }) => void,
    ) => {
      try {
        // 1. Find identity by email
        const identity = await identityRepository.findByEmail(email);
        if (!identity) {
          return done(null, false, { message: 'Invalid credentials' });
        }

        // 2. Check if identity is locked
        if (identity.isLocked()) {
          return done(null, false, { message: 'Account is locked due to too many failed login attempts' });
        }

        // 3. Verify password
        const isValid = await identity.verifyPassword(password, passwordHasher);
        if (!isValid) {
          identity.recordFailedLogin();
          await identityRepository.save(identity);
          return done(null, false, { message: 'Invalid credentials' });
        }

        // 4. Reset failed login attempts on success
        identity.resetFailedAttempts();
        await identityRepository.save(identity);

        // 5. Return user context
        return done(null, {
          identityId: identity.id,
        });
      } catch (err) {
        return done(err instanceof Error ? err : new Error(String(err)));
      }
    },
  );
}
