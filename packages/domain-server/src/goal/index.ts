/**
 * Goal Module - Domain Server
 * 目标模块 - 领域服务端
 * 
 * 【模块职责】
 * 管理用户目标（OKR）的核心业务逻辑，包括目标、关键结果、专注会话、目标文件夹等
 * 
 * 【包含内容】
 * - 聚合根（Aggregates）：Goal, GoalFolder, GoalStatistics, FocusSession
 * - 实体（Entities）：GoalRecord, GoalReview, KeyResult
 * - 值对象（Value Objects）：FocusMode, GoalMetadata, GoalTimeRange, KeyResultProgress 等
 * - 仓储接口（Repositories）：IGoalRepository, IGoalFolderRepository 等
 * - 领域服务（Domain Services）：GoalDomainService, FocusSessionDomainService 等
 * 
 * 【业务特性】
 * - OKR 管理：目标和关键结果的创建、跟踪、评估
 * - 专注会话：番茄钟、专注模式管理
 * - 目标统计：进度统计、完成率分析
 * - 目标组织：文件夹分组、层级管理
 * 
 * 【依赖规则】
 * ✅ 允许依赖：
 * - @dailyuse/utils（基类：AggregateRoot, Entity）
 * - @dailyuse/contracts（DTO 接口、事件 Map）
 * - @dailyuse/domain-shared（值对象、枚举）
 * 
 * ❌ 禁止依赖：
 * - @dailyuse/domain-client（客户端领域模型）
 * - @dailyuse/infrastructure-*（基础设施层）
 * - @dailyuse/application-*（应用层）
 * - 外部 I/O 库（fs, axios, prisma, ioredis 等）
 */

// 值对象
export {
  FocusMode,
  GoalMetadata,
  GoalReminderConfig,
  GoalTimeRange,
  KeyResultProgress,
  KeyResultSnapshot,
  KeyResultWeightSnapshot,
} from './value-objects';

// 实体
export {
  GoalRecord,
  GoalReview,
  KeyResult,
} from './entities';

// 聚合根
export {
  Goal,
  GoalFolder,
  GoalStatistics,
  FocusSession,
} from './aggregates';

// 仓储接口
export type {
  IFocusModeRepository,
  IGoalRepository,
  IGoalFolderRepository,
  IGoalStatisticsRepository,
  IFocusSessionRepository,
  IWeightSnapshotRepository,
  SnapshotQueryResult,
} from './repositories';

// 领域服务
export {
  GoalDomainService,
  GoalFolderDomainService,
  GoalStatisticsDomainService,
  FocusSessionDomainService,
} from './services';
