/**
 * Authentication Module - Infrastructure Server
 *
 * Ports and Adapters for Authentication module persistence.
 */

// Repositories
export { PrismaAuthIdentityRepository } from './repositories/prisma-auth-identity-repository';
export { PrismaAuthSessionRepository } from './repositories/prisma-auth-session-repository';

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
