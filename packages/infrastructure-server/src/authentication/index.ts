/**
 * Authentication Module - Infrastructure Server
 *
 * Ports and Adapters for Authentication module persistence.
 */

// Container
export { AuthContainer } from './auth.container';

// Ports (Interfaces)
export type { IAuthCredentialRepository, IAuthSessionRepository, IPasswordEncryptor, PrismaTransactionClient } from './ports';

// Prisma Adapters
export { AuthCredentialPrismaRepository } from './adapters/prisma/auth-credential-prisma.repository';
export { AuthSessionPrismaRepository } from './adapters/prisma/auth-session-prisma.repository';

// Memory Adapters
export { AuthCredentialMemoryRepository } from './adapters/memory/auth-credential-memory.repository';
export { AuthSessionMemoryRepository } from './adapters/memory/auth-session-memory.repository';

// Encryptors
export { BcryptPasswordEncryptor, createBcryptEncryptor } from './encryptors';

// Strategies
export { createJwtStrategy, createLocalStrategy } from './strategies';
export type { JwtStrategyConfig, LocalStrategyConfig } from './strategies';
