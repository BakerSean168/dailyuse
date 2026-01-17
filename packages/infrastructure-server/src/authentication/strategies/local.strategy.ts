/**
 * Local Authentication Strategy
 *
 * Passport strategy for username/password authentication.
 * Used by login endpoints in Express applications.
 */

import { Strategy as LocalStrategy, IVerifyOptions } from 'passport-local';
import type { IAuthCredentialRepository } from '../ports/auth-credential-repository.port';
import type { IPasswordEncryptor } from '../ports/password-encryptor.port';

export interface LocalStrategyConfig {
  credentialRepository: IAuthCredentialRepository;
  passwordEncryptor: IPasswordEncryptor;
  /**
   * Function to find accountUuid by email.
   * This should query the Account repository.
   */
  findAccountByEmail: (email: string) => Promise<{ uuid: string } | null>;
}

/**
 * Create Local Strategy for Passport
 *
 * Validates username/password credentials.
 * 
 * @example
 * ```ts
 * import passport from 'passport';
 * import { createLocalStrategy } from '@dailyuse/infrastructure-server/authentication';
 * 
 * passport.use('local', createLocalStrategy({
 *   credentialRepository,
 *   passwordEncryptor,
 *   findAccountByEmail: async (email) => {
 *     return accountRepository.findByEmail(email);
 *   },
 * }));
 * ```
 */
export function createLocalStrategy(config: LocalStrategyConfig): LocalStrategy {
  const { credentialRepository, passwordEncryptor, findAccountByEmail } = config;

  return new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
    },
    async (email: string, password: string, done) => {
      try {
        // 1. Find account by email
        const account = await findAccountByEmail(email);
        if (!account) {
          return done(null, false, { message: 'Invalid credentials' });
        }

        // 2. Find credential by accountUuid
        const credential = await credentialRepository.findByAccountUuid(account.uuid);
        if (!credential) {
          return done(null, false, { message: 'Invalid credentials' });
        }

        // 3. Check if credential is locked
        if (credential.isLocked()) {
          return done(null, false, { message: 'Account is locked due to too many failed login attempts' });
        }

        // 4. Check if credential status is active
        if (credential.status !== 'ACTIVE') {
          return done(null, false, { message: 'Account is not active' });
        }

        // 5. Get password credential
        const passwordCredential = credential.passwordCredential;
        if (!passwordCredential) {
          return done(null, false, { message: 'Password authentication not configured' });
        }

        // 6. Verify password
        const isValid = await passwordEncryptor.verify(password, passwordCredential.hashedPassword);

        if (!isValid) {
          // Record failed login
          credential.recordFailedLogin();
          await credentialRepository.save(credential);
          return done(null, false, { message: 'Invalid credentials' });
        }

        // 7. Reset failed login attempts on success
        credential.resetFailedAttempts();
        await credentialRepository.save(credential);

        // 8. Return user context
        return done(null, {
          accountUuid: credential.accountUuid,
          credentialUuid: credential.uuid,
        });
      } catch (error) {
        return done(error);
      }
    },
  );
}
