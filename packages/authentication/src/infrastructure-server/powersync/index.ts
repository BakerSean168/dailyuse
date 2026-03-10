export { PowerSyncAuthIdentityRepository } from '../adapters/powersync/auth-identity-powersync.repository';
export { PowerSyncAuthSessionRepository } from '../adapters/powersync/auth-session-powersync.repository';
export { Argon2Hasher } from '../encryptors/argon2-hasher';
export { AuthenticationContainer } from '../di/authentication-container';
export { AuthenticationRepositoryFactory } from '../di/authentication-repository.factory';
export {
  AuthenticationModule,
  type AuthenticationModuleDependencies,
} from '../authentication.module';
