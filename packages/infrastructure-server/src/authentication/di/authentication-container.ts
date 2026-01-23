import type {
  IAuthCredentialRepository,
  IAuthSessionRepository,
} from '@dailyuse/domain-server/authentication';
import { AuthCredentialPrismaRepository } from '../adapters/prisma/auth-credential-prisma.repository';
import { AuthSessionPrismaRepository } from '../adapters/prisma/auth-session-prisma.repository';
import { prisma } from '../../shared/config/prisma';

/**
 * Authentication 依赖注入容器
 */
export class AuthenticationContainer {
  private static instance: AuthenticationContainer;
  private credentialRepository: IAuthCredentialRepository | null = null;
  private sessionRepository: IAuthSessionRepository | null = null;

  private constructor() {}

  static getInstance(): AuthenticationContainer {
    if (!AuthenticationContainer.instance) {
      AuthenticationContainer.instance = new AuthenticationContainer();
    }
    return AuthenticationContainer.instance;
  }

  getAuthCredentialRepository(): IAuthCredentialRepository {
    if (!this.credentialRepository) {
      this.credentialRepository = new AuthCredentialPrismaRepository(prisma);
    }
    return this.credentialRepository;
  }

  getAuthSessionRepository(): IAuthSessionRepository {
    if (!this.sessionRepository) {
      this.sessionRepository = new AuthSessionPrismaRepository(prisma);
    }
    return this.sessionRepository;
  }

  // For testing purposes
  setAuthCredentialRepository(repository: IAuthCredentialRepository): void {
    this.credentialRepository = repository;
  }

  setAuthSessionRepository(repository: IAuthSessionRepository): void {
    this.sessionRepository = repository;
  }

  reset(): void {
    this.credentialRepository = null;
    this.sessionRepository = null;
  }
}

