/**
 * Authentication Module - SQLite Exports
 */

export { SqliteAuthIdentityRepository } from './adapters/sqlite/auth-identity-sqlite.repository';
export { SqliteAuthSessionRepository } from './adapters/sqlite/auth-session-sqlite.repository';
export { AUTHENTICATION_MODULE_SCHEMA } from './adapters/sqlite/schema';
export { Argon2Hasher } from './encryptors/argon2-hasher';
export { AuthenticationContainer } from './di/authentication-container';
export { AuthenticationRepositoryFactory } from './di/authentication-repository.factory';
export {
  AuthenticationModule,
  type AuthenticationModuleDependencies,
} from './authentication.module';
