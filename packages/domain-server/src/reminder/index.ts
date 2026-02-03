/**
 * Reminder Module - Domain Server
 * 提醒模块 - 领域服务端
 * 
 * 【模块职责】
 * 管理提醒系统的核心业务逻辑，包括提醒模板、提醒组、触发规则等
 * 
 * 【包含内容】
 * - 聚合根（Aggregates）：ReminderTemplate, ReminderGroup
 * - 实体（Entities）：Reminder - 具体的提醒实例
 * - 值对象（Value Objects）：ReminderTrigger, ReminderRecurrence 等
 * - 仓储接口（Repositories）：IReminderRepository, IReminderTemplateRepository
 * - 领域服务（Domain Services）：ReminderSchedulingService
 * - 业务错误（Errors）：ReminderErrors - 提醒相关业务异常
 * 
 * 【业务特性】
 * - 提醒模板：可重用的提醒配置
 * - 提醒组：批量管理相关提醒
 * - 触发规则：时间触发、事件触发、条件触发
 * - 重复规则：每日、每周、自定义重复
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
export * from './value-objects';

// 实体
export * from './entities';

// 聚合根
export * from './aggregates';

// 仓储接口
export * from './repositories';

// 领域服务
export * from './services';

// 业务错误
export * from './errors';
