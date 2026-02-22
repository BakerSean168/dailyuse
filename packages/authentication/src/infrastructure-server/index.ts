/**
 * Authentication Module - Infrastructure Server
 *
 * Ports and Adapters for Authentication module persistence.
 */

// Adapters (Repositories)
export { PrismaAuthIdentityRepository, PrismaAuthSessionRepository } from './adapters/prisma';

// Mappers
export { PrismaAuthIdentityMapper, PrismaAuthSessionMapper } from './mappers/prisma';

// Encryptors
export { Argon2Hasher } from './encryptors/argon2-hasher';

// Strategies
export { createJwtStrategy, createLocalStrategy } from './strategies';
export type { JwtStrategyConfig, LocalStrategyConfig } from './strategies';

// DI Container
export { AuthenticationContainer } from './di/authentication-container';

// Composition Root
export {
	AuthenticationModule,
	type AuthenticationModuleDependencies,
} from './authentication.module';
