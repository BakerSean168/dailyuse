/**
 * @dailyuse/goal
 *
 * 目标模块 - OKR 目标与关键结果管理
 *
 * 【分层架构】
 *
 * contracts           → 类型定义、DTO、事件、API Schema（@dailyuse/contracts/goal）
 * domain-shared       → 值对象（前后端共享）
 * domain-server       → 聚合根、仓储接口、领域服务
 * domain-client       → 客户端领域模型
 * application-server  → 用例服务（服务端）
 * application-client  → 客户端服务
 * infrastructure-server → Prisma/PowerSync 仓储实现、组合根
 * infrastructure-client → HTTP/IPC 适配器
 *
 * 【使用示例】
 *
 * ```typescript
 * // 1. 导入契约
 * import type { GoalServerDTO } from '@dailyuse/contracts/goal';
 *
 * // 2. 导入服务端聚合根
 * import { Goal, GoalFolder } from '@dailyuse/goal/domain-server';
 *
 * // 3. 使用组合根
 * import { createGoalModule } from '@dailyuse/goal/infrastructure-server';
 * const module = createGoalModule({ goalRepository, goalFolderRepository, goalRecordRepository });
 * const result = await module.useCases.createGoal.execute(req, cx);
 * ```
 */

// ================= Contracts Layer =================
export * from '@dailyuse/contracts/goal';

// ================= Domain Layer =================
// Aggregates
export { Goal, GoalFolder, FocusSession, GoalRecord } from './domain-server';
export type { GoalState, GoalFolderState, GoalRecordState } from './domain-server';
// Entities
export { GoalReview, KeyResult } from './domain-server';
export type { GoalReviewState, KeyResultState } from './domain-server';
// Repositories (type-only exports - no conflict with contracts)
export type {
  IGoalRepository,
  IGoalFolderRepository,
  IGoalRecordRepository,
  IFocusModeRepository,
  IFocusSessionRepository,
  IWeightSnapshotRepository,
  GoalRecordQueryOptions,
  SnapshotQueryResult,
} from './domain-server';
// Domain Services
export { FocusSessionPolicy, GoalPolicy, GoalProgressCalculator } from './domain-server';

// ================= Application Layer =================
export * from './application-server';
export * from './application-client';

// ================= Infrastructure Layer =================
export {
  // Prisma adapters
  GoalPrismaRepository,
  GoalFolderPrismaRepository,
  FocusModePrismaRepository,
  FocusSessionPrismaRepository,
  PrismaWeightSnapshotRepository,
  GoalRecordPrismaRepository,
  // PowerSync adapters
  GoalPowerSyncRepository,
  GoalFolderPowerSyncRepository,
  GoalRecordPowerSyncRepository,
  // Composition root
  createGoalModule,
  createGoalUseCases,
  createGoalPowerSyncModule,
  type GoalModuleDependencies,
  type GoalModuleInstance,
  type GoalModuleRuntimeContribution,
  type GoalModuleUseCases,
} from './infrastructure-server';
export * from './infrastructure-client';
export * from './electron-entry';
