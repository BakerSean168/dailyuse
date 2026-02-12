/**
 * Goal Module - Infrastructure Server
 *
 * Repository implementations for Goal domain.
 * Supports both Prisma (API) and SQLite (Desktop) data sources.
 *
 * 遵循 Governance 模块架构：
 * - 此层只包含仓储实现、映射器、端口定义
 * - DI 组装在 api/module.ts 中完成
 */

// ============ Adapters - Prisma ============
export { GoalPrismaRepository } from './adapters/prisma/goal-prisma.repository';
export { GoalFolderPrismaRepository } from './adapters/prisma/goal-folder-prisma.repository';
export { GoalStatisticsPrismaRepository } from './adapters/prisma/goal-statistics-prisma.repository';
export { FocusModePrismaRepository } from './adapters/prisma/focus-mode-prisma.repository';
export { FocusSessionPrismaRepository } from './adapters/prisma/focus-session-prisma.repository';
export { PrismaWeightSnapshotRepository } from './adapters/prisma/weight-snapshot-prisma.repository';

// ============ Adapters - SQLite ============
export { SqliteGoalRepository } from './adapters/sqlite/goal-sqlite.repository';
export { SqliteGoalFolderRepository } from './adapters/sqlite/goal-folder-sqlite.repository';
export { SqliteGoalStatisticsRepository } from './adapters/sqlite/goal-statistics-sqlite.repository';
export { SqliteFocusModeRepository } from './adapters/sqlite/focus-mode-sqlite.repository';
export { SqliteFocusSessionRepository } from './adapters/sqlite/focus-session-sqlite.repository';
export { SqliteWeightSnapshotRepository } from './adapters/sqlite/weight-snapshot-sqlite.repository';

// ============ Ports (Interfaces) ============
export type { IGoalRepository } from './ports/goal-repository.port';

// ============ Mappers ============
export { PrismaWeightSnapshotMapper } from './mappers/prisma-weight-snapshot-mapper';
