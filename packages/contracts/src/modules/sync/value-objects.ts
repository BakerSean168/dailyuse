/**
 * Sync Module - Value Objects
 * 同步模块 - 值对象定义
 * 
 * 【设计原则】
 * 简化版同步模块，专注于本地优先的核心需求：
 * - 增量同步：基于 updatedAt 时间戳
 * - 软删除同步：基于 deletedAt 时间戳
 * - 冲突检测：基于 version 乐观锁
 */

// ============ 枚举类型 ============

/**
 * 可同步的实体类型
 */
export enum SyncableEntityType {
  // Goal 模块
  Goal = 'goal',
  GoalFolder = 'goal_folder',
  GoalKeyResult = 'goal_key_result',
  GoalReview = 'goal_review',
  GoalRecord = 'goal_record',
  GoalFocusSession = 'goal_focus_session',
  
  // Task 模块（未来）
  Task = 'task',
  TaskFolder = 'task_folder',
  
  // Setting 模块
  Setting = 'setting',
}

/**
 * 同步操作类型
 */
export enum SyncOperationType {
  Create = 'create',
  Update = 'update',
  Delete = 'delete', // 软删除
}

/**
 * 冲突解决策略
 */
export enum ConflictResolutionStrategy {
  /** 客户端数据优先（本地优先的默认策略） */
  ClientWins = 'client_wins',
  /** 服务端数据优先 */
  ServerWins = 'server_wins',
  /** 最后写入优先（基于 updatedAt） */
  LastWriteWins = 'last_write_wins',
  /** 手动解决 */
  Manual = 'manual',
}

/**
 * 同步状态
 */
export enum SyncStatus {
  /** 待同步 */
  Pending = 'pending',
  /** 同步中 */
  Syncing = 'syncing',
  /** 已同步 */
  Synced = 'synced',
  /** 同步失败 */
  Failed = 'failed',
  /** 存在冲突 */
  Conflict = 'conflict',
}

// ============ 核心 DTO ============

/**
 * 同步元数据
 * 每个可同步实体都应该包含这些字段
 */
export interface SyncMetadata {
  /** 乐观锁版本号，用于冲突检测 */
  version: number;
  /** 最后更新时间（毫秒时间戳），用于增量同步 */
  updatedAt: number;
  /** 软删除时间（毫秒时间戳），null 表示未删除 */
  deletedAt: number | null;
}

/**
 * 实体引用
 * 用于标识一个可同步的实体
 */
export interface EntityReference {
  /** 实体类型 */
  entityType: SyncableEntityType;
  /** 实体 ID */
  entityId: string;
}

/**
 * 同步变更记录
 * 记录单个实体的变更信息
 */
export interface SyncChange {
  /** 实体引用 */
  entity: EntityReference;
  /** 操作类型 */
  operation: SyncOperationType;
  /** 变更后的数据（删除时为 null） */
  data: unknown | null;
  /** 同步元数据 */
  syncMetadata: SyncMetadata;
  /** 变更时间（毫秒时间戳） */
  changedAt: number;
}

/**
 * 同步冲突
 * 当客户端和服务端版本不一致时产生
 */
export interface SyncConflict {
  /** 实体引用 */
  entity: EntityReference;
  /** 客户端数据 */
  clientData: unknown;
  /** 客户端同步元数据 */
  clientSyncMetadata: SyncMetadata;
  /** 服务端数据 */
  serverData: unknown;
  /** 服务端同步元数据 */
  serverSyncMetadata: SyncMetadata;
  /** 检测到冲突的时间 */
  detectedAt: number;
}

/**
 * 冲突解决结果
 */
export interface ConflictResolution {
  /** 实体引用 */
  entity: EntityReference;
  /** 解决策略 */
  strategy: ConflictResolutionStrategy;
  /** 解决后的数据（手动解决时使用） */
  resolvedData?: unknown;
  /** 解决时间 */
  resolvedAt: number;
}

// ============ 同步请求/响应 DTO ============

/**
 * 拉取同步请求
 * 客户端请求获取服务端的变更
 */
export interface PullSyncRequest {
  /** 用户 ID */
  identityId: string;
  /** 要同步的实体类型列表（为空则同步所有） */
  entityTypes?: SyncableEntityType[];
  /** 上次同步时间（毫秒时间戳），获取此时间之后的变更 */
  lastSyncAt: number;
  /** 分页大小 */
  limit?: number;
  /** 分页游标 */
  cursor?: string;
}

/**
 * 拉取同步响应
 */
export interface PullSyncResponse {
  /** 变更列表 */
  changes: SyncChange[];
  /** 是否有更多数据 */
  hasMore: boolean;
  /** 下一页游标 */
  nextCursor?: string;
  /** 服务端当前时间（毫秒时间戳） */
  serverTime: number;
}

/**
 * 推送同步请求
 * 客户端推送本地变更到服务端
 */
export interface PushSyncRequest {
  /** 用户 ID */
  identityId: string;
  /** 要推送的变更列表 */
  changes: SyncChange[];
}

/**
 * 推送同步响应
 */
export interface PushSyncResponse {
  /** 成功应用的变更数量 */
  appliedCount: number;
  /** 冲突列表 */
  conflicts: SyncConflict[];
  /** 服务端当前时间（毫秒时间戳） */
  serverTime: number;
}

/**
 * 解决冲突请求
 */
export interface ResolveConflictsRequest {
  /** 用户 ID */
  identityId: string;
  /** 冲突解决列表 */
  resolutions: ConflictResolution[];
}

/**
 * 解决冲突响应
 */
export interface ResolveConflictsResponse {
  /** 成功解决的冲突数量 */
  resolvedCount: number;
  /** 解决失败的实体引用列表 */
  failedEntities: EntityReference[];
}

// ============ 同步状态 DTO ============

/**
 * 同步状态信息
 * 用于 UI 显示当前同步状态
 */
export interface SyncStatusInfo {
  /** 当前同步状态 */
  status: SyncStatus;
  /** 上次成功同步时间 */
  lastSyncAt: number | null;
  /** 待同步变更数量 */
  pendingChangesCount: number;
  /** 冲突数量 */
  conflictsCount: number;
  /** 错误信息（如果有） */
  error?: string;
}
