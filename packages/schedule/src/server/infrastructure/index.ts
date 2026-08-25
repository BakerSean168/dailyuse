/**
 * Infrastructure Server Layer - Barrel Export.
 * 基础设施服务端层 - 统一导出。
 *
 * Public seam: ingredient factories, set types, module factory, runtime
 * contribution factories and port types. Concrete adapter classes do not leak
 * through this barrel.
 *
 * 公共 seam：仅导出原料工厂、集合类型、模块工厂、运行时贡献工厂与 Port 类型。
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
export {
  LegacyScheduleTaskSchedulingAdapter,
  createHandlerRegistryScheduleTaskSourceExecutor,
  createScheduleTaskSchedulingPort,
  toScheduledInvocationContext,
  type ScheduleTaskSchedulingAdapterOptions,
} from './scheduling';

// ============ P1-1 Reliable consumer ============
export {
  SCHEDULE_DELIVERY_LOG_EVENT_TYPES,
  type ScheduleEventDeliveryLogEventBus,
} from './consumers/schedule-event-delivery-log.consumer';
