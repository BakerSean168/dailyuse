/**
 * Sync Module Enums
 * 同步模块枚举定义
 *
 * 枚举可在 Server、Client、Persistence 层共享
 */

/**
 * 同步会话状态
 */
export enum SyncSessionStatus {
  PENDING = 'PENDING',
  COLLECTING = 'COLLECTING',
  SYNCING = 'SYNCING',
  CONFLICTED = 'CONFLICTED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

/**
 * 同步方向
 */
export enum SyncDirection {
  PUSH = 'PUSH',
  PULL = 'PULL',
  BIDIRECTIONAL = 'BIDIRECTIONAL',
}

/**
 * 同步策略
 */
export enum SyncStrategy {
  FULL = 'FULL',
  INCREMENTAL = 'INCREMENTAL',
  AUTO = 'AUTO',
}

/**
 * 冲突解决策略
 */
export enum ConflictResolutionStrategy {
  LOCAL_WINS = 'LOCAL_WINS',
  REMOTE_WINS = 'REMOTE_WINS',
  LATEST_WINS = 'LATEST_WINS',
  VECTOR_CLOCK = 'VECTOR_CLOCK',
  MANUAL = 'MANUAL',
}

/**
 * 冲突状态
 */
export enum ConflictStatus {
  UNRESOLVED = 'UNRESOLVED',
  RESOLVED = 'RESOLVED',
  IGNORED = 'IGNORED',
}

/**
 * 变更操作类型
 */
export enum ChangeOperationType {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  RESTORE = 'RESTORE',
}

/**
 * 可同步实体类型
 */
export enum SyncableEntityType {
  GOAL = 'GOAL',
  KEY_RESULT = 'KEY_RESULT',
  GOAL_RECORD = 'GOAL_RECORD',
  GOAL_REVIEW = 'GOAL_REVIEW',
  TASK = 'TASK',
  SCHEDULE = 'SCHEDULE',
  REMINDER = 'REMINDER',
  SETTINGS = 'SETTINGS',
}

/**
 * 同步提供者类型
 */
export enum SyncProviderType {
  GITHUB_GIST = 'GITHUB_GIST',
  WEBDAV = 'WEBDAV',
  CUSTOM_SERVER = 'CUSTOM_SERVER',
  LOCAL_FILE = 'LOCAL_FILE',
}

/**
 * 同步触发方式
 */
export enum SyncTriggerType {
  MANUAL = 'MANUAL',
  AUTO_SCHEDULED = 'AUTO_SCHEDULED',
  ON_CHANGE = 'ON_CHANGE',
  ON_STARTUP = 'ON_STARTUP',
  ON_NETWORK_RESTORE = 'ON_NETWORK_RESTORE',
}

/**
 * 全局同步状态
 */
export enum SyncGlobalStatus {
  IDLE = 'IDLE',
  PENDING = 'PENDING',
  SYNCING = 'SYNCING',
  CONFLICT = 'CONFLICT',
  ERROR = 'ERROR',
  OFFLINE = 'OFFLINE',
}
