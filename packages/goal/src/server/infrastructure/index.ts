/**
 * Goal Module - Infrastructure Server
 * 目标模块 - 服务端基础设施层
 *
 * Repository implementations for Goal domain.
 * 目标领域的仓储实现。
 *
 * 遵循 Governance 模块架构：
 * - 此层只包含仓储实现、映射器、端口定义
 * - 宿主装配（组合根）由 apps 的 runtime composer 完成（apps/api 与
 *   apps/desktop/src/main/runtime）；api/electron module 只做 transport + lifecycle。
 */

// ============ Adapters - Prisma ============
export { GoalPrismaRepository } from './adapters/prisma/goal-prisma.repository';
export { GoalFolderPrismaRepository } from './adapters/prisma/goal-folder-prisma.repository';
export { FocusModePrismaRepository } from './adapters/prisma/focus-mode-prisma.repository';
export { FocusSessionPrismaRepository } from './adapters/prisma/focus-session-prisma.repository';
export { PrismaWeightSnapshotRepository } from './adapters/prisma/weight-snapshot-prisma.repository';
export { GoalRecordPrismaRepository } from './adapters/prisma/goal-record-prisma.repository';
export { PrismaGoalWriteTransactionRunner } from './adapters/prisma/prisma-goal-write-transaction-runner';

// ============ Adapters - PowerSync ============
export { GoalPowerSyncRepository } from './adapters/powersync/goal-powersync.repository';
export { GoalFolderPowerSyncRepository } from './adapters/powersync/goal-folder-powersync.repository';
export { GoalRecordPowerSyncRepository } from './adapters/powersync/goal-record-powersync.repository';
export { PowerSyncGoalWriteTransactionRunner } from './adapters/powersync/powersync-goal-write-transaction-runner';
export { PowerSyncGoalReliableOperationAdapter } from './adapters/powersync/powersync-goal-reliable-operation.adapter';

// ============ Composition Root ============
export {
  createGoalModule,
  createGoalUseCases,
  type GoalModuleDependencies,
  type GoalModuleInstance,
  type GoalModuleRuntimeContribution,
  type GoalModuleUseCases,
  type GoalRuntimeContributionsInput,
} from './goal.module';
export type { GoalApplicationPort } from '../application';
export {
  createGoalPrismaModule,
  createGoalPrismaRepositories,
  createGoalTaskProgressPrismaHandler,
  createGoalPrismaScheduleExecutionSource,
  createGoalPrismaScheduleProjectionSource,
  type GoalRepositorySet,
} from './prisma';
export {
  createGoalRuntimeContribution,
  createGoalEventListenersRuntime,
  type GoalEventListenersRuntime,
} from './runtime';
export {
  createGoalPowerSyncModule,
  createGoalPowerSyncRepositories,
  createGoalTaskProgressPowerSyncHandler,
  createGoalPowerSyncScheduleExecutionSource,
  createGoalPowerSyncScheduleProjectionSource,
} from './powersync';
export {
  createGoalScheduleExecutionSource,
  type CreateGoalScheduleExecutionSourceDeps,
} from './schedule-execution-source';
export {
  createGoalScheduleProjectionEventHandlers,
  createGoalScheduleProjectionSource,
  type GoalScheduleProjectionEventMap,
  type GoalScheduleProjectionHandlers,
  type GoalScheduleProjectionPlan,
  type GoalScheduleProjectionSelection,
  type GoalScheduleProjectionSource,
} from './schedule-projection-source';
