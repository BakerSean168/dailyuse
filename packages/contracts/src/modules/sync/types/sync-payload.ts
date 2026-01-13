/**
 * Sync Payload Types
 * 同步数据负载类型定义
 *
 * 定义跨平台通用的数据同步格式，用于：
 * - 云端同步 (GitHub Gist, WebDAV 等)
 * - 本地导入/导出
 * - 设备间数据迁移
 */

import type { SyncMetadata } from './sync-provider';

/**
 * 数据格式版本
 * 用于向后兼容性检查
 */
export const SYNC_DATA_FORMAT_VERSION = 1;

/**
 * Goal 同步数据
 */
export interface SyncGoalData {
  uuid: string;
  title: string;
  description?: string;
  status: string;
  priority: number;
  startDate?: number;
  endDate?: number;
  progress: number;
  tags?: string[];
  parentGoalUuid?: string;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number;
}

/**
 * Task 同步数据
 */
export interface SyncTaskData {
  uuid: string;
  title: string;
  description?: string;
  status: string;
  priority: number;
  dueDate?: number;
  completedAt?: number;
  estimatedMinutes?: number;
  actualMinutes?: number;
  tags?: string[];
  goalUuid?: string;
  parentTaskUuid?: string;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number;
}

/**
 * Schedule 同步数据
 */
export interface SyncScheduleData {
  uuid: string;
  title: string;
  description?: string;
  type: string;
  startTime: number;
  endTime?: number;
  allDay: boolean;
  recurrence?: {
    rule: string;
    exceptions?: number[];
  };
  reminders?: number[];
  taskUuid?: string;
  goalUuid?: string;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number;
}

/**
 * Reminder 同步数据
 */
export interface SyncReminderData {
  uuid: string;
  title: string;
  message?: string;
  triggerAt: number;
  isCompleted: boolean;
  type: string;
  linkedEntityType?: string;
  linkedEntityUuid?: string;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number;
}

/**
 * 用户设置同步数据
 */
export interface SyncSettingsData {
  theme: string;
  language: string;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  weekStartsOn: number;
  notifications: {
    enabled: boolean;
    sound: boolean;
    desktop: boolean;
    email: boolean;
  };
  sync: {
    autoSync: boolean;
    syncInterval: number;
    conflictStrategy: string;
  };
  privacy: {
    analytics: boolean;
    crashReports: boolean;
  };
  // 扩展设置
  [key: string]: unknown;
}

/**
 * 完整的同步数据包
 */
export interface SyncDataBundle {
  /** 目标数据 */
  goals?: SyncGoalData[];
  /** 任务数据 */
  tasks?: SyncTaskData[];
  /** 日程数据 */
  schedules?: SyncScheduleData[];
  /** 提醒数据 */
  reminders?: SyncReminderData[];
  /** 用户设置 */
  settings?: SyncSettingsData;
  /** 扩展数据（用于未来扩展） */
  extensions?: Record<string, unknown>;
}

/**
 * 同步负载 - 完整的同步数据结构
 *
 * 用于：
 * - 完整数据导出/导入
 * - 云端同步
 * - 设备间数据迁移
 */
export interface SyncPayload {
  /** 数据格式版本 */
  formatVersion: number;
  /** 同步元数据 */
  metadata: SyncMetadata;
  /** 数据包 */
  data: SyncDataBundle;
}

/**
 * 增量同步变更
 */
export interface SyncChange {
  /** 变更 ID */
  id: string;
  /** 操作类型 */
  operation: 'create' | 'update' | 'delete';
  /** 实体类型 */
  entityType: 'goal' | 'task' | 'schedule' | 'reminder' | 'settings';
  /** 实体 ID */
  entityId: string;
  /** 变更数据（create/update 时） */
  data?: unknown;
  /** 变更时间 */
  timestamp: number;
  /** 设备 ID */
  deviceId: string;
}

/**
 * 增量同步负载
 *
 * 用于增量同步，只包含变更的数据
 */
export interface IncrementalSyncPayload {
  /** 数据格式版本 */
  formatVersion: number;
  /** 基础版本号 */
  baseVersion: number;
  /** 目标版本号 */
  targetVersion: number;
  /** 变更列表 */
  changes: SyncChange[];
  /** 时间戳 */
  timestamp: number;
  /** 设备 ID */
  deviceId: string;
}

/**
 * 导入/导出选项
 */
export interface ImportExportOptions {
  /** 是否包含已删除的数据 */
  includeDeleted: boolean;
  /** 是否包含设置 */
  includeSettings: boolean;
  /** 是否压缩 */
  compress: boolean;
  /** 是否加密 */
  encrypt: boolean;
  /** 加密密钥（如果加密） */
  encryptionKey?: string;
  /** 筛选时间范围（开始） */
  startDate?: number;
  /** 筛选时间范围（结束） */
  endDate?: number;
  /** 筛选实体类型 */
  entityTypes?: Array<'goal' | 'task' | 'schedule' | 'reminder' | 'settings'>;
}

/**
 * 导入结果
 */
export interface ImportResult {
  /** 是否成功 */
  success: boolean;
  /** 导入的实体统计 */
  imported: {
    goals: number;
    tasks: number;
    schedules: number;
    reminders: number;
    settings: boolean;
  };
  /** 跳过的实体数量（已存在） */
  skipped: number;
  /** 覆盖的实体数量 */
  overwritten: number;
  /** 错误信息 */
  errors: string[];
  /** 警告信息 */
  warnings: string[];
}

/**
 * 导出结果
 */
export interface ExportResult {
  /** 是否成功 */
  success: boolean;
  /** 导出的实体统计 */
  exported: {
    goals: number;
    tasks: number;
    schedules: number;
    reminders: number;
    settings: boolean;
  };
  /** 导出文件路径 */
  filePath?: string;
  /** 导出数据（如果是内存导出） */
  payload?: SyncPayload;
  /** 文件大小（字节） */
  fileSize?: number;
  /** 错误信息 */
  error?: string;
}
