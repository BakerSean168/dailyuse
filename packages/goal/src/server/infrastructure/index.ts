/**
 * Goal Module - Infrastructure Server
 * 目标模块 - 服务端基础设施层
 *
 * Repository implementations for Goal domain.
 * 目标领域的仓储实现。
 *
 * 遵循 Governance 模块架构：
 * - 此层只包含仓储实现、映射器、端口定义
 * - DI 组装在 api/module.ts 中完成
 */

// ============ Adapters - Prisma ============
export { GoalPrismaRepository } from './adapters/prisma/goal-prisma.repository';
export { GoalFolderPrismaRepository } from './adapters/prisma/goal-folder-prisma.repository';
export { FocusModePrismaRepository } from './adapters/prisma/focus-mode-prisma.repository';
export { FocusSessionPrismaRepository } from './adapters/prisma/focus-session-prisma.repository';
export { PrismaWeightSnapshotRepository } from './adapters/prisma/weight-snapshot-prisma.repository';
export { GoalRecordPrismaRepository } from './adapters/prisma/goal-record-prisma.repository';

// ============ Adapters - PowerSync ============
export { GoalPowerSyncRepository } from './adapters/powersync/goal-powersync.repository';
export { GoalFolderPowerSyncRepository } from './adapters/powersync/goal-folder-powersync.repository';
export { GoalRecordPowerSyncRepository } from './adapters/powersync/goal-record-powersync.repository';

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
  createGoalPrismaScheduleExecutionSource,
  createGoalPrismaScheduleProjectionSource,
} from './prisma';
export {
  createGoalRuntimeContribution,
  type GoalRuntimeContribution,
} from './runtime';
export {
  createGoalPowerSyncModule,
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
