/**
 * SyncChangeTracker - 同步变更追踪器
 *
 * 实现增量同步功能：
 * - 跟踪数据变更（创建、更新、删除）
 * - 支持标记变更已同步
 * - 提供变更数据查询
 * - 与 SyncManager 协作实现增量同步
 */

import { createLogger, type ILogger } from '@dailyuse/utils';
import type { SyncDataBundle, SyncGoalData, SyncTaskData, SyncScheduleData, SyncReminderData, SyncSettingsData } from '@dailyuse/contracts/sync';

/**
 * 变更类型
 */
export type ChangeType = 'create' | 'update' | 'delete';

/**
 * 实体类型
 */
export type EntityType = 'goal' | 'task' | 'schedule' | 'reminder' | 'settings';

/**
 * 变更记录
 */
export interface ChangeRecord {
  /** 变更 ID */
  id: string;
  /** 实体类型 */
  entityType: EntityType;
  /** 实体 UUID */
  entityUuid: string;
  /** 变更类型 */
  changeType: ChangeType;
  /** 变更数据（删除时为 null） */
  data: unknown;
  /** 变更时间戳 */
  timestamp: number;
  /** 是否已同步 */
  synced: boolean;
  /** 同步时间戳 */
  syncedAt?: number;
}

/**
 * 变更统计
 */
export interface ChangeStats {
  total: number;
  unsynced: number;
  byType: Record<EntityType, {
    create: number;
    update: number;
    delete: number;
    unsynced: number;
  }>;
}

/**
 * SyncChangeTracker 配置
 */
export interface SyncChangeTrackerConfig {
  /** 最大变更记录数 */
  maxRecords?: number;
  /** 变更记录保留时间（毫秒） */
  retentionPeriod?: number;
}

/**
 * 同步变更追踪器
 */
export class SyncChangeTracker {
  private static instance: SyncChangeTracker | null = null;

  private readonly logger: ILogger;
  private readonly config: Required<SyncChangeTrackerConfig>;

  // 变更记录存储
  private changes: Map<string, ChangeRecord> = new Map();

  // 变更事件监听器
  private listeners: Map<EntityType, Set<(change: ChangeRecord) => void>> = new Map();

  private constructor(config: SyncChangeTrackerConfig = {}, logger?: ILogger) {
    this.logger = logger || createLogger('SyncChangeTracker');
    this.config = {
      maxRecords: config.maxRecords || 10000,
      retentionPeriod: config.retentionPeriod || 7 * 24 * 60 * 60 * 1000, // 7 天
    };

    // 初始化监听器 Map
    const entityTypes: EntityType[] = ['goal', 'task', 'schedule', 'reminder', 'settings'];
    entityTypes.forEach((type) => {
      this.listeners.set(type, new Set());
    });

    // 加载持久化的变更记录
    this.loadChanges();
  }

  /**
   * 获取单例实例
   */
  static getInstance(config?: SyncChangeTrackerConfig, logger?: ILogger): SyncChangeTracker {
    if (!SyncChangeTracker.instance) {
      SyncChangeTracker.instance = new SyncChangeTracker(config, logger);
    }
    return SyncChangeTracker.instance;
  }

  /**
   * 重置单例（仅用于测试）
   */
  static resetInstance(): void {
    SyncChangeTracker.instance = null;
  }

  // ============ 变更记录 API ============

  /**
   * 记录创建操作
   */
  trackCreate(entityType: EntityType, entityUuid: string, data: unknown): void {
    this.recordChange(entityType, entityUuid, 'create', data);
  }

  /**
   * 记录更新操作
   */
  trackUpdate(entityType: EntityType, entityUuid: string, data: unknown): void {
    this.recordChange(entityType, entityUuid, 'update', data);
  }

  /**
   * 记录删除操作
   */
  trackDelete(entityType: EntityType, entityUuid: string): void {
    this.recordChange(entityType, entityUuid, 'delete', null);
  }

  /**
   * 通用变更记录
   */
  private recordChange(
    entityType: EntityType,
    entityUuid: string,
    changeType: ChangeType,
    data: unknown
  ): void {
    const id = `${entityType}:${entityUuid}:${Date.now()}`;
    const timestamp = Date.now();

    // 检查是否有同一实体的未同步变更
    const existingKey = this.findUnsyncedChangeKey(entityType, entityUuid);

    if (existingKey) {
      // 合并变更
      const existing = this.changes.get(existingKey)!;

      if (changeType === 'delete') {
        // 如果是删除，且之前是创建，则直接移除记录
        if (existing.changeType === 'create') {
          this.changes.delete(existingKey);
          this.logger.debug('Change record merged (create + delete = removed)', {
            entityType,
            entityUuid,
          });
          return;
        }
        // 其他情况，更新为删除
        existing.changeType = 'delete';
        existing.data = null;
        existing.timestamp = timestamp;
      } else if (changeType === 'update') {
        // 更新：保持原来的 changeType（可能是 create）
        existing.data = data;
        existing.timestamp = timestamp;
      }

      this.logger.debug('Change record merged', {
        entityType,
        entityUuid,
        changeType: existing.changeType,
      });
    } else {
      // 新增变更记录
      const record: ChangeRecord = {
        id,
        entityType,
        entityUuid,
        changeType,
        data,
        timestamp,
        synced: false,
      };

      this.changes.set(id, record);

      this.logger.debug('Change recorded', {
        entityType,
        entityUuid,
        changeType,
      });
    }

    // 通知监听器
    this.notifyListeners(entityType, this.changes.get(existingKey || id)!);

    // 清理旧记录
    this.cleanupOldRecords();

    // 持久化
    this.saveChanges();
  }

  /**
   * 查找同一实体的未同步变更
   */
  private findUnsyncedChangeKey(entityType: EntityType, entityUuid: string): string | null {
    for (const [key, record] of this.changes) {
      if (
        record.entityType === entityType &&
        record.entityUuid === entityUuid &&
        !record.synced
      ) {
        return key;
      }
    }
    return null;
  }

  // ============ 查询 API ============

  /**
   * 获取所有未同步的变更
   */
  getUnsyncedChanges(): ChangeRecord[] {
    const records: ChangeRecord[] = [];
    for (const record of this.changes.values()) {
      if (!record.synced) {
        records.push(record);
      }
    }
    return records.sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * 获取指定类型的未同步变更
   */
  getUnsyncedChangesByType(entityType: EntityType): ChangeRecord[] {
    const records: ChangeRecord[] = [];
    for (const record of this.changes.values()) {
      if (record.entityType === entityType && !record.synced) {
        records.push(record);
      }
    }
    return records.sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * 获取未同步数据的 SyncDataBundle
   */
  getUnsyncedDataBundle(): SyncDataBundle {
    const changes = this.getUnsyncedChanges();

    const bundle: SyncDataBundle = {
      goals: [],
      tasks: [],
      schedules: [],
      reminders: [],
      settings: undefined,
    };

    for (const change of changes) {
      if (change.changeType === 'delete') {
        // 删除操作需要特殊处理
        // TODO: 添加 deletedEntities 字段到 SyncDataBundle
        continue;
      }

      switch (change.entityType) {
        case 'goal':
          bundle.goals!.push(change.data as SyncGoalData);
          break;
        case 'task':
          bundle.tasks!.push(change.data as SyncTaskData);
          break;
        case 'schedule':
          bundle.schedules!.push(change.data as SyncScheduleData);
          break;
        case 'reminder':
          bundle.reminders!.push(change.data as SyncReminderData);
          break;
        case 'settings':
          bundle.settings = change.data as SyncSettingsData;
          break;
      }
    }

    return bundle;
  }

  /**
   * 获取变更统计
   */
  getStats(): ChangeStats {
    const stats: ChangeStats = {
      total: this.changes.size,
      unsynced: 0,
      byType: {
        goal: { create: 0, update: 0, delete: 0, unsynced: 0 },
        task: { create: 0, update: 0, delete: 0, unsynced: 0 },
        schedule: { create: 0, update: 0, delete: 0, unsynced: 0 },
        reminder: { create: 0, update: 0, delete: 0, unsynced: 0 },
        settings: { create: 0, update: 0, delete: 0, unsynced: 0 },
      },
    };

    for (const record of this.changes.values()) {
      stats.byType[record.entityType][record.changeType]++;
      if (!record.synced) {
        stats.unsynced++;
        stats.byType[record.entityType].unsynced++;
      }
    }

    return stats;
  }

  /**
   * 检查是否有未同步的变更
   */
  hasUnsyncedChanges(): boolean {
    for (const record of this.changes.values()) {
      if (!record.synced) {
        return true;
      }
    }
    return false;
  }

  // ============ 同步状态管理 ============

  /**
   * 标记变更为已同步
   */
  markAsSynced(changeIds: string[]): void {
    const syncedAt = Date.now();

    for (const id of changeIds) {
      const record = this.changes.get(id);
      if (record) {
        record.synced = true;
        record.syncedAt = syncedAt;
      }
    }

    this.logger.info('Changes marked as synced', { count: changeIds.length });
    this.saveChanges();
  }

  /**
   * 标记所有变更为已同步
   */
  markAllAsSynced(): void {
    const syncedAt = Date.now();

    for (const record of this.changes.values()) {
      if (!record.synced) {
        record.synced = true;
        record.syncedAt = syncedAt;
      }
    }

    this.logger.info('All changes marked as synced');
    this.saveChanges();
  }

  /**
   * 重置同步状态（用于强制全量同步）
   */
  resetSyncStatus(): void {
    for (const record of this.changes.values()) {
      record.synced = false;
      record.syncedAt = undefined;
    }

    this.logger.info('Sync status reset');
    this.saveChanges();
  }

  /**
   * 清除所有已同步的变更
   */
  clearSyncedChanges(): void {
    const keysToDelete: string[] = [];

    for (const [key, record] of this.changes) {
      if (record.synced) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.changes.delete(key);
    }

    this.logger.info('Synced changes cleared', { count: keysToDelete.length });
    this.saveChanges();
  }

  /**
   * 清除所有变更记录
   */
  clearAllChanges(): void {
    this.changes.clear();
    this.logger.info('All changes cleared');
    this.saveChanges();
  }

  // ============ 事件监听 ============

  /**
   * 添加变更监听器
   */
  addListener(entityType: EntityType, listener: (change: ChangeRecord) => void): void {
    const listeners = this.listeners.get(entityType);
    if (listeners) {
      listeners.add(listener);
    }
  }

  /**
   * 移除变更监听器
   */
  removeListener(entityType: EntityType, listener: (change: ChangeRecord) => void): void {
    const listeners = this.listeners.get(entityType);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  /**
   * 通知监听器
   */
  private notifyListeners(entityType: EntityType, change: ChangeRecord): void {
    const listeners = this.listeners.get(entityType);
    if (listeners) {
      for (const listener of listeners) {
        try {
          listener(change);
        } catch (error) {
          this.logger.error('Listener error', { entityType, error });
        }
      }
    }
  }

  // ============ 持久化 ============

  /**
   * 加载变更记录
   */
  private loadChanges(): void {
    try {
      // TODO: 从 electron-store 或文件加载
      // 目前使用内存存储
      this.logger.debug('Changes loaded (in-memory)');
    } catch (error) {
      this.logger.error('Failed to load changes', { error });
    }
  }

  /**
   * 保存变更记录
   */
  private saveChanges(): void {
    try {
      // TODO: 保存到 electron-store 或文件
      // 目前使用内存存储
      this.logger.debug('Changes saved (in-memory)', { count: this.changes.size });
    } catch (error) {
      this.logger.error('Failed to save changes', { error });
    }
  }

  /**
   * 清理旧记录
   */
  private cleanupOldRecords(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    // 清理过期的已同步记录
    for (const [key, record] of this.changes) {
      if (record.synced && record.syncedAt) {
        if (now - record.syncedAt > this.config.retentionPeriod) {
          keysToDelete.push(key);
        }
      }
    }

    // 如果超过最大数量，删除最旧的已同步记录
    if (this.changes.size > this.config.maxRecords) {
      const syncedRecords = Array.from(this.changes.entries())
        .filter(([, r]) => r.synced)
        .sort((a, b) => a[1].timestamp - b[1].timestamp);

      const toRemove = this.changes.size - this.config.maxRecords;
      for (let i = 0; i < Math.min(toRemove, syncedRecords.length); i++) {
        keysToDelete.push(syncedRecords[i][0]);
      }
    }

    // 执行删除
    for (const key of keysToDelete) {
      this.changes.delete(key);
    }

    if (keysToDelete.length > 0) {
      this.logger.debug('Old records cleaned up', { count: keysToDelete.length });
    }
  }
}

/**
 * 获取 SyncChangeTracker 实例
 */
export function getSyncChangeTracker(
  config?: SyncChangeTrackerConfig,
  logger?: ILogger
): SyncChangeTracker {
  return SyncChangeTracker.getInstance(config, logger);
}
