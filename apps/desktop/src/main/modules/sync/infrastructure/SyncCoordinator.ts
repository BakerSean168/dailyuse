/**
 * SyncCoordinator - 同步协调器
 *
 * 协调网络状态、变更追踪、数据收集器与同步管理器的工作
 * 实现智能同步策略：
 * - 网络上线时自动触发同步
 * - 离线时累积变更
 * - 支持增量同步和全量同步
 * - 冲突检测和解决
 */

import { createLogger, type ILogger } from '@dailyuse/utils';
import type { SyncStatus, SyncResult, SyncProgress } from '@dailyuse/contracts/sync';
import { SyncManager, type IDataCollector } from './SyncManager';
import { DataCollector } from './DataCollector';
import { SyncChangeTracker, type ChangeRecord, type EntityType } from './SyncChangeTracker';
import { 
  NetworkStateManager, 
  type NetworkStatus 
} from '../../authentication/infrastructure/NetworkStateManager';

/**
 * SyncCoordinator 配置
 */
export interface SyncCoordinatorConfig {
  /** 是否启用自动同步 */
  enableAutoSync?: boolean;
  /** 网络恢复后同步延迟（毫秒） */
  networkRecoverySyncDelay?: number;
  /** 变更累积同步阈值 */
  changeThreshold?: number;
  /** 变更累积同步间隔（毫秒） */
  changeDebounceTime?: number;
}

/**
 * 同步协调器
 */
export class SyncCoordinator {
  private static instance: SyncCoordinator | null = null;

  private readonly logger: ILogger;
  private readonly config: Required<SyncCoordinatorConfig>;

  // 子系统
  private syncManager: SyncManager;
  private dataCollector: DataCollector;
  private changeTracker: SyncChangeTracker;
  private networkManager: NetworkStateManager;

  // 状态
  private isInitialized = false;
  private syncInProgress = false;
  private pendingSyncTimeout: NodeJS.Timeout | null = null;

  // 事件监听器
  private listeners: Map<string, Set<(...args: unknown[]) => void>> = new Map();

  private constructor(config: SyncCoordinatorConfig = {}, logger?: ILogger) {
    this.logger = logger || createLogger('SyncCoordinator');
    this.config = {
      enableAutoSync: config.enableAutoSync ?? true,
      networkRecoverySyncDelay: config.networkRecoverySyncDelay ?? 2000,
      changeThreshold: config.changeThreshold ?? 10,
      changeDebounceTime: config.changeDebounceTime ?? 5000,
    };

    // 获取子系统实例
    this.syncManager = SyncManager.getInstance();
    this.dataCollector = DataCollector.getInstance();
    this.changeTracker = SyncChangeTracker.getInstance();
    this.networkManager = NetworkStateManager.getInstance();
  }

  /**
   * 获取单例实例
   */
  static getInstance(config?: SyncCoordinatorConfig, logger?: ILogger): SyncCoordinator {
    if (!SyncCoordinator.instance) {
      SyncCoordinator.instance = new SyncCoordinator(config, logger);
    }
    return SyncCoordinator.instance;
  }

  /**
   * 重置单例（仅用于测试）
   */
  static resetInstance(): void {
    if (SyncCoordinator.instance) {
      SyncCoordinator.instance.cleanup();
      SyncCoordinator.instance = null;
    }
  }

  // ============ 初始化 ============

  /**
   * 初始化同步协调器
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      this.logger.warn('SyncCoordinator already initialized');
      return;
    }

    this.logger.info('Initializing SyncCoordinator');

    // 设置 SyncManager 的数据收集器
    this.syncManager.setDataCollector(this.dataCollector);

    // 监听网络状态变化
    this.setupNetworkListeners();

    // 监听变更追踪器
    this.setupChangeListeners();

    this.isInitialized = true;
    this.logger.info('SyncCoordinator initialized');
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    this.logger.info('Cleaning up SyncCoordinator');

    // 清除待处理的同步
    if (this.pendingSyncTimeout) {
      clearTimeout(this.pendingSyncTimeout);
      this.pendingSyncTimeout = null;
    }

    // 移除所有监听器
    this.listeners.clear();

    this.isInitialized = false;
  }

  // ============ 网络状态集成 ============

  /**
   * 设置网络状态监听器
   */
  private setupNetworkListeners(): void {
    // 网络上线时触发同步
    this.networkManager.on('online', () => {
      this.handleNetworkOnline();
    });

    // 网络离线时的处理
    this.networkManager.on('offline', () => {
      this.handleNetworkOffline();
    });
  }

  /**
   * 处理网络上线
   */
  private async handleNetworkOnline(): Promise<void> {
    this.logger.info('Network came online, preparing to sync');

    if (!this.config.enableAutoSync) {
      return;
    }

    // 延迟同步，等待网络稳定
    if (this.pendingSyncTimeout) {
      clearTimeout(this.pendingSyncTimeout);
    }

    this.pendingSyncTimeout = setTimeout(async () => {
      await this.triggerSync('network-recovery');
    }, this.config.networkRecoverySyncDelay);
  }

  /**
   * 处理网络离线
   */
  private handleNetworkOffline(): void {
    this.logger.info('Network went offline, sync will be queued');

    // 取消待处理的同步
    if (this.pendingSyncTimeout) {
      clearTimeout(this.pendingSyncTimeout);
      this.pendingSyncTimeout = null;
    }
  }

  // ============ 变更追踪集成 ============

  /**
   * 设置变更监听器
   */
  private setupChangeListeners(): void {
    const entityTypes: EntityType[] = ['goal', 'task', 'schedule', 'reminder', 'settings'];

    for (const type of entityTypes) {
      this.changeTracker.addListener(type, (change) => {
        this.handleDataChange(change);
      });
    }
  }

  /**
   * 处理数据变更
   */
  private handleDataChange(change: ChangeRecord): void {
    this.logger.debug('Data change detected', {
      type: change.entityType,
      uuid: change.entityUuid,
      changeType: change.changeType,
    });

    // 检查是否需要触发同步
    if (this.config.enableAutoSync && this.networkManager.isOnline()) {
      this.scheduleDebouncedSync();
    }
  }

  /**
   * 调度去抖动同步
   */
  private scheduleDebouncedSync(): void {
    // 检查变更数量是否达到阈值
    const stats = this.changeTracker.getStats();

    if (stats.unsynced >= this.config.changeThreshold) {
      // 达到阈值，立即同步
      this.triggerSync('change-threshold');
      return;
    }

    // 否则，使用去抖动
    if (this.pendingSyncTimeout) {
      clearTimeout(this.pendingSyncTimeout);
    }

    this.pendingSyncTimeout = setTimeout(async () => {
      if (this.changeTracker.hasUnsyncedChanges()) {
        await this.triggerSync('change-debounce');
      }
    }, this.config.changeDebounceTime);
  }

  // ============ 同步操作 ============

  /**
   * 触发同步
   */
  async triggerSync(reason: string): Promise<SyncResult | null> {
    if (this.syncInProgress) {
      this.logger.warn('Sync already in progress, skipping', { reason });
      return null;
    }

    if (!this.networkManager.isOnline()) {
      this.logger.warn('Network offline, sync queued', { reason });
      return null;
    }

    this.logger.info('Triggering sync', { reason });
    this.syncInProgress = true;
    this.emit('syncStart', { reason });

    try {
      // 使用增量同步
      const result = await this.performIncrementalSync();

      if (result.success) {
        // 标记变更为已同步
        this.changeTracker.markAllAsSynced();
        this.emit('syncSuccess', result);
      } else {
        this.emit('syncError', result);
      }

      return result;
    } catch (error) {
      this.logger.error('Sync failed', { reason, error });
      this.emit('syncError', { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    } finally {
      this.syncInProgress = false;
      this.emit('syncEnd', { reason });
    }
  }

  /**
   * 执行增量同步
   */
  private async performIncrementalSync(): Promise<SyncResult> {
    // 检查是否有活跃的提供者
    const providers = this.syncManager.getProviders();
    if (providers.length === 0) {
      this.logger.warn('No sync providers available');
      return {
        success: false,
        error: 'No sync providers configured',
      };
    }

    // 获取未同步的变更
    const hasChanges = this.changeTracker.hasUnsyncedChanges();

    if (hasChanges) {
      // 有本地变更，执行推送同步
      this.logger.info('Pushing local changes');
      return await this.syncManager.pushSync();
    } else {
      // 没有本地变更，执行拉取同步
      this.logger.info('Pulling remote changes');
      return await this.syncManager.pullSync();
    }
  }

  /**
   * 强制全量同步
   */
  async forceFullSync(): Promise<SyncResult | null> {
    if (this.syncInProgress) {
      this.logger.warn('Sync already in progress');
      return null;
    }

    if (!this.networkManager.isOnline()) {
      this.logger.warn('Network offline');
      return {
        success: false,
        error: 'Network offline',
      };
    }

    this.logger.info('Forcing full sync');
    this.syncInProgress = true;
    this.emit('syncStart', { reason: 'force-full' });

    try {
      const result = await this.syncManager.fullSync();

      if (result.success) {
        this.changeTracker.clearAllChanges();
        this.emit('syncSuccess', result);
      } else {
        this.emit('syncError', result);
      }

      return result;
    } catch (error) {
      this.logger.error('Full sync failed', { error });
      this.emit('syncError', { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    } finally {
      this.syncInProgress = false;
      this.emit('syncEnd', { reason: 'force-full' });
    }
  }

  // ============ 数据变更 API ============

  /**
   * 记录目标变更
   */
  trackGoalChange(uuid: string, changeType: 'create' | 'update' | 'delete', data?: unknown): void {
    if (changeType === 'delete') {
      this.changeTracker.trackDelete('goal', uuid);
    } else if (changeType === 'create') {
      this.changeTracker.trackCreate('goal', uuid, data);
    } else {
      this.changeTracker.trackUpdate('goal', uuid, data);
    }
  }

  /**
   * 记录任务变更
   */
  trackTaskChange(uuid: string, changeType: 'create' | 'update' | 'delete', data?: unknown): void {
    if (changeType === 'delete') {
      this.changeTracker.trackDelete('task', uuid);
    } else if (changeType === 'create') {
      this.changeTracker.trackCreate('task', uuid, data);
    } else {
      this.changeTracker.trackUpdate('task', uuid, data);
    }
  }

  /**
   * 记录日程变更
   */
  trackScheduleChange(uuid: string, changeType: 'create' | 'update' | 'delete', data?: unknown): void {
    if (changeType === 'delete') {
      this.changeTracker.trackDelete('schedule', uuid);
    } else if (changeType === 'create') {
      this.changeTracker.trackCreate('schedule', uuid, data);
    } else {
      this.changeTracker.trackUpdate('schedule', uuid, data);
    }
  }

  /**
   * 记录提醒变更
   */
  trackReminderChange(uuid: string, changeType: 'create' | 'update' | 'delete', data?: unknown): void {
    if (changeType === 'delete') {
      this.changeTracker.trackDelete('reminder', uuid);
    } else if (changeType === 'create') {
      this.changeTracker.trackCreate('reminder', uuid, data);
    } else {
      this.changeTracker.trackUpdate('reminder', uuid, data);
    }
  }

  // ============ 状态查询 ============

  /**
   * 获取同步状态
   */
  getSyncStatus(): SyncStatus {
    return this.syncManager.getStatus();
  }

  /**
   * 获取变更统计
   */
  getChangeStats() {
    return this.changeTracker.getStats();
  }

  /**
   * 检查是否有待同步的变更
   */
  hasPendingChanges(): boolean {
    return this.changeTracker.hasUnsyncedChanges();
  }

  /**
   * 检查网络状态
   */
  getNetworkStatus(): NetworkStatus {
    return this.networkManager.getStatus();
  }

  /**
   * 检查是否正在同步
   */
  isSyncing(): boolean {
    return this.syncInProgress;
  }

  // ============ 事件系统 ============

  /**
   * 添加事件监听器
   */
  on(event: string, listener: (...args: unknown[]) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
  }

  /**
   * 移除事件监听器
   */
  off(event: string, listener: (...args: unknown[]) => void): void {
    this.listeners.get(event)?.delete(listener);
  }

  /**
   * 触发事件
   */
  private emit(event: string, data?: unknown): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      for (const listener of eventListeners) {
        try {
          listener(data);
        } catch (error) {
          this.logger.error('Event listener error', { event, error });
        }
      }
    }
  }
}

/**
 * 获取 SyncCoordinator 实例
 */
export function getSyncCoordinator(
  config?: SyncCoordinatorConfig,
  logger?: ILogger
): SyncCoordinator {
  return SyncCoordinator.getInstance(config, logger);
}
