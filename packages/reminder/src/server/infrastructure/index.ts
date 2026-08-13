/**
 * Reminder Module - Infrastructure Server Layer.
 * 提醒模块 - 基础设施服务端层。
 *
 * Server-side infrastructure:
 * 服务端基础设施：
 * - Repository implementations (Prisma, PowerSync)
 *   仓储实现（Prisma、PowerSync）
 * - Explicit composition root and runtime assembly
 *   显式组合根与运行时组装
 */

// ============ Composition Root / 组合根 ============
export {
  createReminderModule,
  createReminderUseCases,
  type ReminderModuleDependencies,
  type ReminderModuleInstance,
  type ReminderModuleUseCases,
  type ReminderModuleRuntimeContribution,
  type ReminderRuntimeContributionsInput,
} from './reminder.module';
export type { ReminderApplicationPort } from '../application';

// ============ Adapters - Prisma ============
/** @internal Concrete Prisma implementation — use repository interfaces instead. Prisma 具体实现 — 请使用仓储接口。 */
export { ReminderGroupPrismaRepository } from './adapters/prisma/reminder-group-prisma.repository';
/** @internal Concrete Prisma implementation — use repository interfaces instead. Prisma 具体实现 — 请使用仓储接口。 */
export { ReminderTemplatePrismaRepository } from './adapters/prisma/reminder-template-prisma.repository';
/** @internal Concrete Prisma implementation — use repository interfaces instead. Prisma 具体实现 — 请使用仓储接口。 */
export { ReminderResponsePrismaRepository } from './adapters/prisma/reminder-response-prisma.repository';
/** @internal Concrete Prisma implementation — use repository interfaces instead. Prisma 具体实现 — 请使用仓储接口。 */
export { UserReminderPreferencePrismaRepository } from './adapters/prisma/user-reminder-preference-prisma.repository';

// ============ Adapters - PowerSync ============
/** @internal Concrete PowerSync implementation — use repository interfaces instead. PowerSync 具体实现 — 请使用仓储接口。 */
export { ReminderGroupPowerSyncRepository } from './adapters/powersync/reminder-group-powersync.repository';
/** @internal Concrete PowerSync implementation — use repository interfaces instead. PowerSync 具体实现 — 请使用仓储接口。 */
export { ReminderTemplatePowerSyncRepository } from './adapters/powersync/reminder-template-powersync.repository';
/** @internal Concrete PowerSync implementation — use repository interfaces instead. PowerSync 具体实现 — 请使用仓储接口。 */
export { ReminderResponsePowerSyncRepository } from './adapters/powersync/reminder-response-powersync.repository';
/** @internal Concrete PowerSync implementation — use repository interfaces instead. PowerSync 具体实现 — 请使用仓储接口。 */
export { UserReminderPreferencePowerSyncRepository } from './adapters/powersync/user-reminder-preference-powersync.repository';

// ============ PowerSync Module Factory / PowerSync 模块工厂 ============
export { createReminderPowerSyncModule } from './powersync';
export { createReminderPowerSyncScheduleExecutionSource } from './powersync';
export { createReminderPowerSyncScheduleProjectionSource } from './powersync';
export {
  createReminderScheduleExecutionSource,
  type CreateReminderScheduleExecutionSourceDeps,
} from './schedule-execution-source';
export {
  createReminderScheduleProjectionEventHandlers,
  createReminderScheduleProjectionSource,
  type ReminderScheduleProjectionEventMap,
  type ReminderScheduleProjectionHandlers,
  type ReminderScheduleProjectionPlan,
  type ReminderScheduleProjectionSelection,
  type ReminderScheduleProjectionSource,
} from './schedule-projection-source';
export {
  createReminderPrismaModule,
  createReminderPrismaRepositories,
  createReminderPrismaScheduleExecutionSource,
  createReminderPrismaScheduleProjectionSource,
  type CreateReminderPrismaModuleOptions,
} from './prisma';
export {
  createReminderRuntimeContribution,
} from './runtime';
export { ReminderAccountClosedConsumer } from './consumers/reminder-account-closed.consumer';
