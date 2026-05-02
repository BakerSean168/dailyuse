/**
 * Goal Module - Domain Client
 * 目标模块 - 领域客户端
 *
 * 【模块职责】
 * 管理用户目标（OKR）的客户端领域模型
 *
 * 【包含内容】
 * - 聚合根（Aggregates）：Goal, GoalFolder
 * - 实体（Entities）：KeyResult, GoalReview, GoalRecord
 * - 值对象（Value Objects）：从 domain-shared 导入
 *
 * 【依赖规则】
 * ✅ 允许依赖：
 * - @dailyuse/utils（基类：AggregateRoot, Entity）
 * - @dailyuse/contracts（DTO 接口、Client 接口）
 * - @dailyuse/domain-shared（值对象、枚举）
 */

// ===== Aggregates =====
export * from './aggregates';

// ===== Entities =====
export * from './entities';

// ===== Value Objects (re-export from domain-shared) =====
export * from '../domain-shared';
