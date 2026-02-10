/**
 * Authentication Dependency Injection Container
 *
 * Manages repository instances for the Authentication module.
 * Uses constructor-injected PrismaClient from @dailyuse/database.
 */

import type { PrismaClient } from '@dailyuse/database';
import type { IAuthIdentityRepository, IAuthSessionRepository } from '../../domain-server';
import type { IPasswordHasher } from '../../domain-shared';
import { PrismaAuthIdentityRepository } from '../repositories/prisma-auth-identity-repository';
import { PrismaAuthSessionRepository } from '../repositories/prisma-auth-session-repository';
import { Argon2Hasher } from '../encryptors/argon2-hasher';

/**
 * Authentication 依赖注入容器
 */
export class AuthenticationContainer {
  private identityRepository: IAuthIdentityRepository | null = null;
  private sessionRepository: IAuthSessionRepository | null = null;
  private passwordHasher: IPasswordHasher | null = null;

  constructor(private readonly prisma: PrismaClient) {}

  getIdentityRepository(): IAuthIdentityRepository {
    if (!this.identityRepository) {
      this.identityRepository = new PrismaAuthIdentityRepository(this.prisma);
    }
    return this.identityRepository;
  }

  getSessionRepository(): IAuthSessionRepository {
    if (!this.sessionRepository) {
      this.sessionRepository = new PrismaAuthSessionRepository(this.prisma);
    }
    return this.sessionRepository;
  }

  getPasswordHasher(): IPasswordHasher {
    if (!this.passwordHasher) {
      this.passwordHasher = new Argon2Hasher();
    }
    return this.passwordHasher;
  }

  // For testing purposes
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
