/**
 * Goal Module - Domain Server
 * 目标模块 - 领域服务端
 * 
 * 【模块职责】
 * 管理用户目标（OKR）的核心业务逻辑，包括目标、关键结果、专注会话、目标文件夹等
 * 
 * 【包含内容】
 * - 聚合根（Aggregates）：Goal, GoalFolder, FocusSession
 * - 实体（Entities）：GoalRecord, GoalReview, KeyResult
 * - 值对象（Value Objects）：从 @dailyuse/domain 导出
 * - 仓储接口（Repositories）：IGoalRepository, IGoalFolderRepository 等
 * - 领域服务（Domain Services）：FocusSessionPolicy, GoalPolicy, GoalProgressCalculator 等
 * 
 * 【业务特性】
 * - OKR 管理：目标和关键结果的创建、跟踪、评估
 * - 专注会话：番茄钟、专注模式管理
 * - 目标组织：文件夹分组、层级管理
 * 
 * 【依赖规则】
 * ✅ 允许依赖：
 * - @dailyuse/utils（基类：AggregateRoot, Entity）
 * - @dailyuse/contracts（DTO 接口、事件 Map）
 * - @dailyuse/domain（值对象、枚举）
 * 
 * ❌ 禁止依赖：
 * - @dailyuse/domain-client（客户端领域模型）
 * - @dailyuse/infrastructure-*（基础设施层）
 * - @dailyuse/application-*（应用层）
 * - 外部 I/O 库（fs, axios, prisma, ioredis 等）
 */

// 聚合根
export * from './aggregates';

// 实体
export * from './entities';

// 值对象
export * from './value-objects';

// 仓储接口
export type {
  IFocusModeRepository,
  IGoalRepository,
  IGoalFolderRepository,
  IFocusSessionRepository,
  IWeightSnapshotRepository,
  SnapshotQueryResult,
} from './repositories';

// 领域服务（只保留真正的领域服务）
export {
  FocusSessionPolicy,
  GoalPolicy,
  GoalProgressCalculator,
} from './services';

// 导出仓储接口类型
export type {
  IGoalRecordRepository,
  GoalRecordQueryOptions,
} from './repositories';


// Priority calculator (canonical: domain/priority)
export {
  DailyPriorityCalculator,
  type PriorityLevel,
  type PriorityCalculationResult,
} from './priority';
