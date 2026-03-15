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
  type ScheduleApplicationPort,
  type ScheduleModuleDependencies,
  type ScheduleModuleInstance,
  type ScheduleModuleRuntimeContribution,
  type ScheduleModuleUseCases,
  type ScheduleRuntimeContributionsInput,
} from './schedule.module';
export { createSchedulePowerSyncModule } from './powersync';

// ============ Legacy (deprecated) ============
/**
 * @deprecated The schedule module no longer uses this container internally.
 *             It is kept only for backward compatibility with older callers (e.g. reminder module).
 * @deprecated 调度模块内部已不再使用该容器；当前仅为兼容旧调用方保留（如 reminder 模块）。
 *
 * @see {@link createScheduleModule} Use the composition root factory for dependency injection.
 * @see {@link createScheduleModule} 使用组合根工厂进行依赖注入。
 */
export { ScheduleContainer } from './di/schedule-container';

export { SchedulerBootstrap } from './scheduler-bootstrap';
