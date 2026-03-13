/**
 * @dailyuse/account
 *
 * Account module - User account management.
 *
 * Layered architecture:
 *
 * contracts               - Type definitions, DTOs, events, API schemas
 * domain-shared           - Value object factories (shared between client and server)
 * domain-server           - Aggregate roots, repository interfaces
 * domain-client           - Client-side domain model
 * application-server      - Use cases (server-side)
 * application-client      - Client-side services
 * infrastructure-server   - Prisma repository implementations
 * infrastructure-client   - HTTP/IPC adapters
 * api                     - Express API module
 *
 * @example
 * ```typescript
 * // 1. Import contracts
 * import type { AccountClientDTO } from '@dailyuse/contracts/account';
 *
 * // 2. Import server-side aggregate root
 * import { Account } from '@dailyuse/account/domain-server';
 *
 * // 3. Import API module (in apps/api)
 * import { AccountApiModule } from '@dailyuse/account/api';
 * bootstrapper.register(AccountApiModule);
 * ```
 */

// ================= Contracts Layer =================
export * from '@dailyuse/contracts/account';

// ================= Domain Layer =================
export { Account } from './domain-server';
export type { IAccountRepository } from './domain-server';

// ================= Application Layer =================
export * from './application-server';
export * from './application-client';

// ================= Infrastructure Layer =================
export {
  PrismaAccountRepository,
  PowerSyncAccountRepository,
  AccountModule,
} from './infrastructure-server';
export * from './infrastructure-client';
export * from './electron-entry';
