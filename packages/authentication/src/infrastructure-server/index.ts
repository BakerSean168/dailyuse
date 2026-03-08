/**
 * Authentication Module - Infrastructure Server
 *
 * Ports and Adapters for Authentication module persistence.
 */

// Adapters (Prisma Repositories)
export { PrismaAuthIdentityRepository, PrismaAuthSessionRepository } from './adapters/prisma';

// Adapters (SQLite Repositories)
export { SqliteAuthIdentityRepository, SqliteAuthSessionRepository } from './adapters/sqlite';

// SQLite Schema
export { AUTHENTICATION_MODULE_SCHEMA } from './adapters/sqlite/schema';

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
