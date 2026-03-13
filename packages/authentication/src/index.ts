/**
 * @dailyuse/authentication
 *
 * Authentication module - identity authentication and session management.
 *
 * Layered Architecture:
 *
 * contracts              - Type definitions, DTOs, events, API schemas
 * domain-shared          - Value objects, IPasswordHasher (shared between client/server)
 * domain-server          - Aggregate roots (AuthIdentity, AuthSession), repository interfaces
 * application-server     - Use case services (Login, Register, Logout, etc.)
 * infrastructure-server  - Prisma repositories, Argon2 hashing, Passport strategies
 * api                    - Express API module
 *
 * Usage example:
 *
 * ```typescript
 * // 1. Import contracts
 * import type { AuthIdentityServerDTO } from '@dailyuse/contracts/authentication';
 *
 * // 2. Import server-side aggregate roots
 * import { AuthIdentity, AuthSession } from '@dailyuse/authentication/domain-server';
 *
 * // 3. Import API module (in apps/api)
 * import { AuthenticationApiModule } from '@dailyuse/authentication/api';
 * bootstrapper.register(AuthenticationApiModule);
 * ```
 */

// ================= Contracts Layer =================
export * from '@dailyuse/contracts/authentication';

// ================= Domain Layer =================
export { AuthIdentity } from './domain-server';
export { AuthSession } from './domain-server';
export type { IAuthIdentityRepository, IAuthSessionRepository } from './domain-server';

// ================= Application Layer =================
export * from './application-server';
export * from './application-client';

// ================= Infrastructure Layer =================
export {
  PrismaAuthIdentityRepository,
  PrismaAuthSessionRepository,
  PowerSyncAuthIdentityRepository,
  PowerSyncAuthSessionRepository,
  Argon2Hasher,
  AuthenticationContainer,
  AuthenticationRepositoryFactory,
  AuthenticationModule,
} from './infrastructure-server';
export * from './infrastructure-client';
