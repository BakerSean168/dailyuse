/**
 * Infrastructure Server Layer - Barrel Export.
 * 基础设施服务端层 - 统一导出。
 *
 * Server-side infrastructure:
 * 服务端基础设施：
 * - Repository implementations (Prisma, PowerSync)
 *   仓储实现（Prisma、PowerSync）
 * - Persistence mappers
 *   持久化映射器
 * - Explicit composition root and runtime assembly
 *   显式组合根与运行时组装
 */

// ============ Adapters - Prisma ============
/** @internal Concrete Prisma implementation — use IScheduleRepository interface instead. Prisma 具体实现 — 请使用 IScheduleRepository 接口。 */
export {
  SchedulePrismaRepository,
  ScheduleTaskPrismaRepository,
  ScheduleExecutionPrismaRepository,
} from './adapters/prisma';

// ============ Adapters - PowerSync ============
/** @internal Concrete PowerSync implementation — use repository interfaces instead. PowerSync 具体实现 — 请使用仓储接口。 */
export {
  PowerSyncScheduleRepository,
  PowerSyncScheduleTaskRepository,
  PowerSyncScheduleExecutionRepository,
} from './adapters/powersync';

// ============ Composition Root ============
export {
  createScheduleModule,
  createScheduleUseCases,
  type ScheduleModuleDependencies,
  type ScheduleModuleInstance,
  type ScheduleModuleRuntimeContribution,
  type ScheduleModuleUseCases,
  type ScheduleRuntimeContributionsInput,
} from './schedule.module';
export type { ScheduleApplicationPort, ScheduleEventApplicationPort } from '../application';
export {
  createSchedulePowerSyncModule,
  createSchedulePowerSyncRepositories,
  type SchedulePowerSyncRepositories,
} from './powersync';
export {
  createSchedulePrismaModule,
  createSchedulePrismaRepository,
  createScheduleTaskPrismaRepository,
  createScheduleExecutionPrismaRepository,
  type CreateSchedulePrismaModuleOptions,
} from './prisma';
export {
  createScheduleRuntimeContribution,
  type ScheduleRuntimeContribution,
  type ScheduleTaskExecutionResult,
  type ScheduleTaskSourceExecutor,
} from './runtime';
