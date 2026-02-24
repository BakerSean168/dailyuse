/**
 * Authentication Dependency Injection Container
 *
 * Manages repository instances for the Authentication module.
 * Supports both Prisma and SQLite data sources via AuthenticationRepositoryFactory.
 */

import type { IAuthIdentityRepository, IAuthSessionRepository } from '../../domain-server';
import type { IPasswordHasher } from '../../domain-shared';
import { Argon2Hasher } from '../encryptors/argon2-hasher';

/**
 * Authentication 依赖注入容器
 *
 * Repositories are registered externally (via factory or manual setter)
 * so that the container itself is driver-agnostic.
 */
export class AuthenticationContainer {
  private static instance: AuthenticationContainer;

  private identityRepository: IAuthIdentityRepository | null = null;
  private sessionRepository: IAuthSessionRepository | null = null;
  private passwordHasher: IPasswordHasher | null = null;

  private constructor() {}

  static getInstance(): AuthenticationContainer {
    if (!AuthenticationContainer.instance) {
      AuthenticationContainer.instance = new AuthenticationContainer();
    }
    return AuthenticationContainer.instance;
  }

  getIdentityRepository(): IAuthIdentityRepository {
    if (!this.identityRepository) {
      throw new Error(
        'AuthenticationContainer: identityRepository not registered. Call setIdentityRepository() or use AuthenticationRepositoryFactory first.',
      );
    }
    return this.identityRepository;
  }

  getSessionRepository(): IAuthSessionRepository {
    if (!this.sessionRepository) {
      throw new Error(
        'AuthenticationContainer: sessionRepository not registered. Call setSessionRepository() or use AuthenticationRepositoryFactory first.',
      );
    }
    return this.sessionRepository;
  }

  getPasswordHasher(): IPasswordHasher {
    if (!this.passwordHasher) {
      this.passwordHasher = new Argon2Hasher();
    }
    return this.passwordHasher;
  }

  setIdentityRepository(repository: IAuthIdentityRepository): void {
    this.identityRepository = repository;
  }

  setSessionRepository(repository: IAuthSessionRepository): void {
    this.sessionRepository = repository;
  }

  setPasswordHasher(hasher: IPasswordHasher): void {
    this.passwordHasher = hasher;
  }

  reset(): void {
    this.identityRepository = null;
    this.sessionRepository = null;
    this.passwordHasher = null;
  }
}
