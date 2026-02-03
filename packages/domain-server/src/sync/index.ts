/**
 * Sync Module - Domain Server
 * 同步模块 - 领域服务端
 * 
 * 【模块职责】
 * 管理多端数据同步的核心业务逻辑，包括同步会话、冲突解决、版本管理等
 * 
 * 【包含内容】
 * - 聚合根（Aggregates）：SyncSession, SyncProfile
 * - 实体（Entities）：SyncConflict, PendingChange
 * - 值对象（Value Objects）：SyncVersion, EntityReference, ConflictResolution 等
 * - 仓储接口（Repositories）：ISyncSessionRepository, ISyncProfileRepository 等
 * 
 * 【业务特性】
 * - 多端同步：Web、Desktop、Mobile 设备间的数据同步
 * - 冲突检测：自动检测并记录数据冲突
 * - 冲突解决：多种解决策略（客户端优先、服务器优先、手动）
 * - 版本管理：向量时钟、版本号跟踪
 * - 增量同步：只同步变更的数据，提高效率
 * - 设备管理：同步设备信息、会话统计
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

// Value Objects
export {
  SyncVersion,
  EntityReference,
  ConflictResolution,
  SyncDeviceInfo,
  SyncProfileConfig,
  SyncSessionStats,
} from './value-objects';

// Entities
export { SyncConflict, PendingChange } from './entities';

// Aggregates
export { SyncSession, SyncProfile } from './aggregates';

// Repository Interfaces
export type {
  ISyncSessionRepository,
  SyncSessionQueryOptions,
  ISyncProfileRepository,
  SyncProfileQueryOptions,
  IPendingChangeRepository,
  PendingChangeQueryOptions,
  ISyncConflictRepository,
  SyncConflictQueryOptions,
} from './repositories';
