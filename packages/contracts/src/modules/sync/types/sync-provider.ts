/**
 * Sync Provider Types
 * 同步提供者相关类型定义
 *
 * 定义可扩展的同步提供者接口，支持多种后端：
 * - GitHub Gist (首选)
 * - WebDAV
 * - Custom Server
 */

import type { SyncPayload, SyncDataBundle } from './sync-payload';

// Re-export for convenience
export type { SyncPayload, SyncDataBundle };

/**
 * 同步提供者类型枚举
 */
export type SyncProviderType = 'github-gist' | 'webdav' | 'custom-server' | 'local-file';

/**
 * 同步操作类型
 */
export type SyncOperation = 'push' | 'pull' | 'merge' | 'full-sync';

/**
 * 同步状态
 */
export type SyncStatus =
  | 'idle' // 空闲
  | 'syncing' // 同步中
  | 'success' // 成功
  | 'error' // 错误
  | 'conflict' // 冲突
  | 'offline'; // 离线

/**
 * 冲突解决策略
 */
export type ConflictResolutionStrategy =
  | 'local-wins' // 本地优先
  | 'remote-wins' // 远程优先
  | 'latest-wins' // 最新时间戳优先
  | 'manual'; // 手动解决

/**
 * 同步提供者配置基类
 */
export interface SyncProviderConfig {
  /** 提供者类型 */
  type: SyncProviderType;
  /** 是否启用 */
  enabled: boolean;
  /** 自动同步间隔（毫秒，0 表示禁用自动同步） */
  autoSyncInterval: number;
  /** 冲突解决策略 */
  conflictStrategy: ConflictResolutionStrategy;
}

/**
 * GitHub Gist 提供者配置
 */
export interface GitHubGistProviderConfig extends SyncProviderConfig {
  type: 'github-gist';
  /** GitHub OAuth Access Token */
  accessToken: string;
  /** Gist ID（已创建的 Gist） */
  gistId?: string;
  /** Gist 描述 */
  gistDescription?: string;
  /** 是否为私密 Gist */
  isPrivate: boolean;
}

/**
 * WebDAV 提供者配置
 */
export interface WebDAVProviderConfig extends SyncProviderConfig {
  type: 'webdav';
  /** WebDAV 服务器 URL */
  serverUrl: string;
  /** 用户名 */
  username: string;
  /** 密码 */
  password: string;
  /** 同步目录路径 */
  remotePath: string;
}

/**
 * 本地文件提供者配置（用于导入/导出）
 */
export interface LocalFileProviderConfig extends SyncProviderConfig {
  type: 'local-file';
  /** 导出目录路径 */
  exportPath: string;
}

/**
 * 同步元数据
 */
export interface SyncMetadata {
  /** 最后同步时间 */
  lastSyncAt: number;
  /** 同步版本号 */
  version: number;
  /** 数据校验和 */
  checksum: string;
  /** 同步来源设备 ID */
  deviceId: string;
  /** 同步来源设备名称 */
  deviceName: string;
  /** 数据创建时间 */
  createdAt: number;
  /** 数据更新时间 */
  updatedAt: number;
}

/**
 * 同步结果
 */
export interface SyncResult {
  /** 是否成功 */
  success: boolean;
  /** 操作类型 */
  operation: SyncOperation;
  /** 同步的实体数量 */
  syncedCount: number;
  /** 冲突数量 */
  conflictCount: number;
  /** 错误信息 */
  error?: string;
  /** 详细错误 */
  details?: string;
  /** 新版本号 */
  newVersion?: number;
  /** 同步时间 */
  timestamp: number;
}

/**
 * 同步进度
 */
export interface SyncProgress {
  /** 当前状态 */
  status: SyncStatus;
  /** 操作类型 */
  operation: SyncOperation;
  /** 进度百分比 (0-100) */
  percentage: number;
  /** 当前处理的实体 */
  currentEntity?: string;
  /** 已处理数量 */
  processedCount: number;
  /** 总数量 */
  totalCount: number;
  /** 开始时间 */
  startedAt: number;
  /** 预计剩余时间（毫秒） */
  estimatedTimeRemaining?: number;
}

/**
 * 同步冲突信息
 */
export interface SyncConflict {
  /** 冲突 ID */
  id: string;
  /** 实体类型 */
  entityType: string;
  /** 实体 ID */
  entityId: string;
  /** 本地版本 */
  localVersion: unknown;
  /** 远程版本 */
  remoteVersion: unknown;
  /** 本地更新时间 */
  localUpdatedAt: number;
  /** 远程更新时间 */
  remoteUpdatedAt: number;
  /** 冲突描述 */
  description: string;
}

/**
 * 同步提供者接口
 * 所有同步提供者必须实现此接口
 */
export interface ISyncProvider {
  /** 提供者类型 */
  readonly type: SyncProviderType;

  /** 提供者名称 */
  readonly name: string;

  /** 是否已连接/认证 */
  isConnected(): boolean;

  /**
   * 初始化提供者
   */
  initialize(): Promise<void>;

  /**
   * 连接/认证
   */
  connect(): Promise<boolean>;

  /**
   * 断开连接
   */
  disconnect(): Promise<void>;

  /**
   * 推送数据到远程
   */
  push(payload: SyncPayload): Promise<SyncResult>;

  /**
   * 从远程拉取数据
   */
  pull(): Promise<SyncPayload | null>;

  /**
   * 获取远程元数据
   */
  getRemoteMetadata(): Promise<SyncMetadata | null>;

  /**
   * 清空远程数据
   */
  clear(): Promise<void>;
}

/**
 * 同步提供者事件
 */
export interface SyncProviderEvents {
  'sync:start': { operation: SyncOperation };
  'sync:progress': SyncProgress;
  'sync:complete': SyncResult;
  'sync:error': { error: string; details?: string };
  'sync:conflict': SyncConflict;
  'connection:changed': { connected: boolean };
}
