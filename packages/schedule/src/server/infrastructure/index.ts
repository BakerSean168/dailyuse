/**
 * Infrastructure Server Layer - Barrel Export.
 * 基础设施服务端层 - 统一导出。
 *
 * Public seam: ingredient factories, set types, module factory, runtime
 * contribution factories and port types. Concrete adapter classes do not leak
 * through this barrel unless a transport/app still consumes them directly
 * (marked @internal, removed in Step E).
 *
 * 公共 seam：仅导出原料工厂、集合类型、模块工厂、运行时贡献工厂与 Port 类型。
 * 除非 transport/app 仍直接消费（以 @internal 标记，Step E 移除），
 * 具体适配器类不通过该 barrel 泄漏。
 */

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
  createSchedulePrismaRepositories,
  createSchedulePrismaRepository,
  createScheduleTaskPrismaRepository,
  createScheduleExecutionPrismaRepository,
  type CreateSchedulePrismaModuleOptions,
  type ScheduleRepositorySet,
} from './prisma';
export {
  createScheduleRuntimeContribution,
  type ScheduleRuntimeDependencies,
  type ScheduleTaskExecutionResult,
  type ScheduleTaskSourceExecutor,
} from './runtime';

// ============ P1-1 Reliable consumer ============
export {
  SCHEDULE_DELIVERY_LOG_EVENT_TYPES,
  type ScheduleEventDeliveryLogEventBus,
} from './consumers/schedule-event-delivery-log.consumer';

// ============ Adapters still consumed by frozen transports/apps ============
/** @internal 仍被 schedule/electron 与 apps/desktop 直接消费的具体 PowerSync 实现 — Step E 移除。 */
export { PowerSyncScheduleTaskRepository } from './adapters/powersync/schedule-task-powersync.repository';
