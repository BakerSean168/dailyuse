/**
 * @dailyuse/account
 *
 * Account module — User account management.
 *
 * Layered architecture:
 *
 * ```
 * ┌─────────────────────────────────────────────────────────┐
 * │  contracts (Contracts Layer)                             │
 * │  - Type definitions (interface/type)                     │
 * │  - DTO (Client/Server/Persistence)                      │
 * │  - Domain events                                        │
 * │  - API Schema (Zod)                                     │
 * ├─────────────────────────────────────────────────────────┤
 * │  domain-shared (Shared Domain Layer)                     │
 * │  - Value object factories (ID generation, validation)   │
 * │  - Client/server shared business rules                  │
 * ├─────────────────────────────────────────────────────────┤
 * │  domain-server (Server Domain Layer)                     │
 * │  - Aggregate roots (Account)                             │
 * │  - Repository interfaces (IAccountRepository)           │
 * ├─────────────────────────────────────────────────────────┤
 * │  domain-client (Client Domain Layer)                     │
 * │  - Client-side domain model                              │
 * ├─────────────────────────────────────────────────────────┤
 * │  application-server (Server Application Layer)           │
 * │  - Use cases (commands + queries)                       │
 * ├─────────────────────────────────────────────────────────┤
 * │  application-client (Client Application Layer)           │
 * │  - Client services, view model mappers                  │
 * ├─────────────────────────────────────────────────────────┤
 * │  infrastructure-server (Server Infrastructure Layer)     │
 * │  - Prisma / PowerSync repository implementations        │
 * │  - Composition root (createAccountModule)               │
 * ├─────────────────────────────────────────────────────────┤
 * │  infrastructure-client (Client Infrastructure Layer)     │
 * │  - HTTP / IPC adapters                                  │
 * └─────────────────────────────────────────────────────────┘
 * ```
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
 *
 * // 4. Use composition root directly
 * import { createAccountModule } from '@dailyuse/account/infrastructure-server';
 * const module = createAccountModule({ accountRepository });
 * const profile = await module.api.getProfile(identityId);
 * ```
 */

// ================= Contracts Layer (契约层) =================
// Type definitions, DTOs, Events, API Schemas
export * from '@dailyuse/contracts/account';

// ================= Domain Layer (领域层) =================
// Domain-Shared: Value objects and shared logic (exported from contracts)
// Domain-Server: Aggregates, repository interfaces (server-side)
// Domain-Client: Client-side domain models (UI view models)
export { Account } from './domain-server';
export type { IAccountRepository } from './domain-server';

// Note: domain-client exports Account class with the same name.
// Consumers should import from specific subpath to avoid conflicts:
// 注意：domain-client 导出同名 Account 类，请使用子路径导入以避免冲突：
//   import { Account } from '@dailyuse/account/domain-client';

// ================= Application Layer (应用层) =================
// Application-Server: Use cases (server-side)
// Application-Client: Client services, view model mappers
// Note: DTOs are already exported from contracts layer
export * from './application-server';
export * from './application-client';

// ================= Infrastructure Layer (基础设施层) =================
// Infrastructure-Server: Repositories, persistence, composition root (server-side)
// Infrastructure-Client: HTTP/IPC adapters (client-side)
export { createAccountModule, createAccountUseCases, type AccountApplicationPort, type AccountModuleDependencies, type AccountModuleInstance, type AccountModuleRuntimeContribution, type AccountModuleUseCases } from './infrastructure-server';

export * from './infrastructure-client';
