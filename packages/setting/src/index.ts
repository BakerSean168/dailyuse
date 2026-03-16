/**
 * @dailyuse/setting
 *
 * User preference management module.
 *
 * ## Layer Architecture
 *
 * contracts              → type definitions, DTOs, preferences, events  (@dailyuse/contracts/setting)
 * domain-shared          → value objects (SettingId)
 * domain-server          → aggregate roots (UserSetting), repository ports, domain errors
 * domain-client          → client-side domain model
 * application-server     → use cases (Get/Patch/Reset/Export/Import)
 * application-client     → client service facade
 * infrastructure-server  → Prisma / PowerSync repository adapters, composition root
 * infrastructure-client  → HTTP / IPC transport adapters
 *
 * ## Quick Start
 *
 * ```ts
 * // Server — composition root
 * import { createSettingModule } from '@dailyuse/setting/infrastructure-server';
 *
 * // Client — service + adapter
 * import { createSettingClientService } from '@dailyuse/setting/application-client';
 * import { SettingHttpAdapter }         from '@dailyuse/setting/infrastructure-client';
 *
 * // Contracts (types only)
 * import type { UserSettingClientDTO } from '@dailyuse/contracts/setting';
 * ```
 */

// ================= Contracts Layer =================
// Re-exported for convenience; prefer importing directly from
// `@dailyuse/contracts/setting` when possible.
export * from '@dailyuse/contracts/setting';

// ================= Domain Layer =================
export * from './domain-server';

// ================= Application Layer =================
export * from './application-server';
export {
  SettingClientService,
  createSettingClientService,
  type SettingClientPort,
  type ISettingApiClient,
} from './application-client';

// ================= Infrastructure Layer =================
// Server
export {
  createSettingModule,
  createSettingUseCases,
  type SettingApplicationPort,
  type SettingModuleDependencies,
  type SettingModuleInstance,
  type SettingModuleRuntimeContribution,
  type SettingModuleUseCases,
} from './infrastructure-server';

export {
  UserSettingPrismaRepository,
  UserSettingPowerSyncRepository,
  createSettingPowerSyncModule,
} from './infrastructure-server';

// Client
export {
  SettingHttpAdapter,
  createSettingHttpAdapters,
  type SettingHttpAdapters,
  SettingIpcAdapter,
  createSettingIpcAdapters,
  type SettingIpcAdapters,
  type IResultHttpClient,
  type IResultIpcClient,
} from './infrastructure-client';
