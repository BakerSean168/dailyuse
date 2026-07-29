/**
 * Schedule Module - Domain Server
 * 调度模块 - 领域服务端
 * 
 * 【模块职责】
 * 管理时间调度系统的核心业务逻辑，包括日程管理、时间线、可用性计算等
 * 
 * 【包含内容】
 * - 聚合根（Aggregates）：Schedule, TimeBlock, Calendar
 * - 实体（Entities）：ScheduleEvent, TimeSlot
 * - 值对象（Value Objects）：`server/domain/value-objects`
 * - 仓储接口（Repositories）：IScheduleRepository, ICalendarRepository
 * - 领域服务（Domain Services）：SchedulingService, ConflictDetectionService
 * - 业务计算器（Calculators）：时间计算、冲突检测算法
 * - 错误类（Errors）：调度相关业务异常
 * 
 * 【业务特性】
 * - 日程管理：事件创建、编辑、删除、查询
 * - 时间块：时间分片管理、专注时段
 * - 重复规则：每日、每周、每月、自定义重复
 * - 冲突检测：时间冲突、资源冲突自动检测
 * - 可用性计算：空闲时间查找、最佳时间推荐
 * - 日历集成：多日历同步、外部日历导入
 * 
 * 【依赖规则】
 * ✅ 允许依赖：
 * - @memoflow/utils（基类：AggregateRoot, Entity）
 * - @memoflow/contracts（DTO 接口、事件 Map）
 * - @memoflow/domain-shared（值对象、枚举）
 * 
 * ❌ 禁止依赖：
 * - @memoflow/domain-client（客户端领域模型）
 * - @memoflow/infrastructure-*（基础设施层）
 * - @memoflow/application-*（应用层）
 * - 外部 I/O 库（fs, axios, prisma, ioredis 等）
 */

// ============ 值对象 ============
export * from './value-objects';

// ============ 实体 ============
export * from './entities';

// ============ 聚合根 ============
export * from './aggregates';

// ============ 仓储接口 ============
export * from './repositories';

// ============ 领域服务 ============
export * from './services';

// ============ 业务计算器 ============
export * from './calculators';
