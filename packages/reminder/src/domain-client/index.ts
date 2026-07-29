/**
 * Reminder Module - Domain Client
 * 提醒模块 - 领域客户端
 *
 * 【模块职责】
 * 管理提醒（Reminder）的客户端领域模型
 *
 * 【包含内容】
 * - 聚合根（Aggregates）：ReminderTemplate, ReminderGroup
 * - 实体（Entities）：ReminderHistory
 * - 值对象（Value Objects）：从 server/domain 导入
 *
 * 【依赖规则】
 * ✅ 允许依赖：
 * - @memoflow/utils（基类：AggregateRoot, Entity）
 * - @memoflow/contracts（DTO 接口、Client 接口）
 * - @memoflow/contracts（值对象 DTO、枚举）
 */

// ===== Aggregates =====
export * from './aggregates';

// ===== Entities =====
export * from './entities';

// ===== Value Objects (re-export from server/domain) =====
export * from '../server/domain/value-objects';
