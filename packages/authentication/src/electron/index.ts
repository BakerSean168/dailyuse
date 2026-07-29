/**
 * Authentication Electron seam.
 *
 * Desktop-main callers use this seam for auth-specific Electron helpers.
 * Public DTO/schema contracts remain centralized in
 * `@memoflow/contracts/authentication`.
 */

export { DeviceInfo } from '../server/domain';
export { AuthIdentity, AuthSession } from '../server/domain';
export type {
  IAuthIdentityRepository,
  IAuthSessionRepository,
  IPasswordHasher,
} from '../server/domain';
export {
  Argon2Hasher,
  PowerSyncAuthIdentityRepository,
  PowerSyncAuthSessionRepository,
} from '../server/infrastructure';
