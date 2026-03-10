/**
 * Goal Module - Infrastructure Server
 *
 * Repository implementations for Goal domain.
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
export { GoalModule, type GoalModuleRepositories } from './goal.module';
export { GoalContainer } from './di/goal-container';
