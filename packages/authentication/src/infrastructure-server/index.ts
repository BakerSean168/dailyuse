/**
 * Authentication Module - Infrastructure Server
 *
 * Ports and Adapters for Authentication module persistence.
 */

// Adapters (Prisma Repositories)
export { PrismaAuthIdentityRepository, PrismaAuthSessionRepository } from './adapters/prisma';

// Adapters (PowerSync Repositories)
export {
  PowerSyncAuthIdentityRepository,
  PowerSyncAuthSessionRepository,
} from './adapters/powersync';

// Encryptors
export { Argon2Hasher } from './encryptors/argon2-hasher';

// Services
export { JwtTokenProvider } from './services/jwt-token-provider';

// Strategies
export { createJwtStrategy, createLocalStrategy } from './strategies';
export type { JwtStrategyConfig, LocalStrategyConfig } from './strategies';

// DI Container & Factory
export { AuthenticationContainer } from './di/authentication-container';
export { AuthenticationRepositoryFactory } from './di/authentication-repository.factory';

// Composition Root
export {
  AuthenticationModule,
  type AuthenticationModuleDependencies,
} from './authentication.module';
