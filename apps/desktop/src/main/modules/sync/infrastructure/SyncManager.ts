/**
 * SyncManager - 同步管理器
 *
 * 负责协调数据同步的核心服务：
 * - 管理同步提供者
 * - 调度自动同步
 * - 处理同步冲突
 * - 监控同步状态
 *
 * 架构：
 * - SyncManager 是单例，协调所有同步操作
 * - 支持多个 SyncProvider（GitHub Gist, WebDAV 等）
 * - 使用 EventEmitter 发布同步事件
 */

import { EventEmitter } from 'events';
import { createLogger, type ILogger } from '@dailyuse/utils';
import type {
  SyncStatus,
  SyncOperation,
  SyncResult,
  SyncProgress,
  SyncConflict,
  SyncPayload,
  SyncMetadata,
  SyncDataBundle,
  ConflictResolutionStrategy,
  ISyncProvider,
  SyncProviderType,
} from '@dailyuse/contracts/sync';
import { SYNC_DATA_FORMAT_VERSION } from '@dailyuse/contracts/sync';
import { app } from 'electron';
import * as os from 'os';
import * as crypto from 'crypto';

// Re-export types for convenience
export type {
  SyncStatus,
  SyncOperation,
  SyncResult,
  SyncProgress,
  SyncConflict,
  SyncPayload,
  SyncMetadata,
  SyncDataBundle,
  ISyncProvider,
};

/**
 * SyncManager 配置
 */
export interface SyncManagerConfig {
  /** 自动同步间隔（毫秒） */
  autoSyncInterval: number;
  /** 冲突解决策略 */
  conflictStrategy: ConflictResolutionStrategy;
  /** 是否启用自动同步 */
  enableAutoSync: boolean;
  /** 设备 ID */
  deviceId?: string;
  /** 设备名称 */
  deviceName?: string;
}

const DEFAULT_CONFIG: SyncManagerConfig = {
  autoSyncInterval: 5 * 60 * 1000, // 5 分钟
  conflictStrategy: 'latest-wins',
  enableAutoSync: true,
};

/**
 * SyncManager 事件类型
 */
export interface SyncManagerEvents {
  'sync:start': { operation: SyncOperation; provider: SyncProviderType };
  'sync:progress': SyncProgress;
  'sync:complete': SyncResult;
  'sync:error': { error: string; details?: string };
  'sync:conflict': SyncConflict;
  'sync:status-changed': { status: SyncStatus; provider?: SyncProviderType };
  'provider:connected': { provider: SyncProviderType };
  'provider:disconnected': { provider: SyncProviderType };
}

/**
 * 数据收集器接口
 * 用于从各模块收集需要同步的数据
 */
export interface IDataCollector {
  /** 收集所有数据用于同步 */
  collectAllData(): Promise<SyncDataBundle>;
  /** 应用同步数据到本地 */
  applyData(data: SyncDataBundle): Promise<void>;
  /** 获取上次同步版本 */
  getLastSyncVersion(): Promise<number>;
  /** 更新同步版本 */
  updateSyncVersion(version: number): Promise<void>;
}

/**
 * 同步管理器
 *
 * 负责协调所有同步操作，支持多个同步提供者
 */
export class SyncManager extends EventEmitter {
  private static instance: SyncManager | null = null;

  private readonly logger: ILogger;
  private readonly config: SyncManagerConfig;

  // 同步提供者映射
  private providers: Map<SyncProviderType, ISyncProvider> = new Map();
  // 当前活跃的提供者
  private activeProvider: SyncProviderType | null = null;
  // 数据收集器
  private dataCollector: IDataCollector | null = null;

  // 状态
  private currentStatus: SyncStatus = 'idle';
  private isSyncing = false;
  private lastSyncTime: number | null = null;
  private autoSyncTimer: NodeJS.Timeout | null = null;

  // 设备信息
  private deviceId: string;
  private deviceName: string;

  private constructor(config: Partial<SyncManagerConfig> = {}, logger?: ILogger) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.logger = logger || createLogger('SyncManager');

    // 生成设备 ID
    this.deviceId = config.deviceId || this.generateDeviceId();
    this.deviceName = config.deviceName || os.hostname();
  }

  /**
   * 获取单例实例
   */
  static getInstance(config?: Partial<SyncManagerConfig>, logger?: ILogger): SyncManager {
    if (!SyncManager.instance) {
      SyncManager.instance = new SyncManager(config, logger);
    }
    return SyncManager.instance;
  }

  /**
   * 重置单例（仅用于测试）
   */
  static resetInstance(): void {
    if (SyncManager.instance) {
      SyncManager.instance.cleanup();
      SyncManager.instance = null;
    }
  }

  // ============ 初始化 ============

  /**
   * 初始化同步管理器
   */
  async initialize(): Promise<void> {
    this.logger.info('Initializing SyncManager', {
      deviceId: this.deviceId,
      deviceName: this.deviceName,
    });

    // 启动自动同步
    if (this.config.enableAutoSync) {
      this.startAutoSync();
    }

    this.logger.info('SyncManager initialized');
  }

  /**
   * 设置数据收集器
   */
  setDataCollector(collector: IDataCollector): void {
    this.dataCollector = collector;
    this.logger.info('Data collector set');
  }

  // ============ 提供者管理 ============

  /**
   * 注册同步提供者
   */
  registerProvider(provider: ISyncProvider): void {
    this.providers.set(provider.type, provider);
    this.logger.info('Provider registered', { type: provider.type, name: provider.name });
  }

  /**
   * 获取提供者
   */
  getProvider(type: SyncProviderType): ISyncProvider | undefined {
    return this.providers.get(type);
  }

  /**
   * 获取所有已注册的提供者
   */
  getProviders(): ISyncProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * 设置活跃提供者
   */
  async setActiveProvider(type: SyncProviderType): Promise<boolean> {
    const provider = this.providers.get(type);
    if (!provider) {
      this.logger.error('Provider not found', { type });
      return false;
    }

    try {
      // 如果未连接，尝试连接
      if (!provider.isConnected()) {
        const connected = await provider.connect();
        if (!connected) {
          this.logger.error('Failed to connect provider', { type });
          return false;
        }
      }

      this.activeProvider = type;
      this.emit('provider:connected', { provider: type });
      this.logger.info('Active provider set', { type });
      return true;
    } catch (error) {
      this.logger.error('Error setting active provider', { type, error });
      return false;
    }
  }

  /**
   * 获取活跃提供者
   */
  getActiveProvider(): ISyncProvider | null {
    if (!this.activeProvider) return null;
    return this.providers.get(this.activeProvider) || null;
  }

  // ============ 同步操作 ============

  /**
   * 执行完整同步（推送 + 拉取）
   */
  async fullSync(): Promise<SyncResult> {
    const operation: SyncOperation = 'full-sync';
    return this.executeSync(operation, async () => {
      // 先拉取远程数据
      const pullResult = await this.pull();
      if (!pullResult.success && pullResult.error !== 'NO_REMOTE_DATA') {
        return pullResult;
      }

      // 再推送本地数据
      const pushResult = await this.push();
      return {
        ...pushResult,
        operation,
        syncedCount: pullResult.syncedCount + pushResult.syncedCount,
      };
    });
  }

  /**
   * 推送本地数据到远程
   */
  async push(): Promise<SyncResult> {
    const operation: SyncOperation = 'push';
    return this.executeSync(operation, async () => {
      const provider = this.getActiveProvider();
      if (!provider) {
        throw new Error('No active sync provider');
      }

      if (!this.dataCollector) {
        throw new Error('No data collector set');
      }

      // 收集本地数据
      const data = await this.dataCollector.collectAllData();
      const version = await this.dataCollector.getLastSyncVersion();

      // 创建同步负载
      const payload = this.createSyncPayload(data, version + 1);

      // 推送到远程
      const result = await provider.push(payload);

      // 更新本地版本号
      if (result.success && result.newVersion) {
        await this.dataCollector.updateSyncVersion(result.newVersion);
      }

      return result;
    });
  }

  /**
   * 从远程拉取数据
   */
  async pull(): Promise<SyncResult> {
    const operation: SyncOperation = 'pull';
    return this.executeSync(operation, async () => {
      const provider = this.getActiveProvider();
      if (!provider) {
        throw new Error('No active sync provider');
      }

      if (!this.dataCollector) {
        throw new Error('No data collector set');
      }

      // 拉取远程数据
      const payload = await provider.pull();

      if (!payload) {
        return {
          success: true,
          operation,
          syncedCount: 0,
          conflictCount: 0,
          error: 'NO_REMOTE_DATA',
          timestamp: Date.now(),
        };
      }

      // 检查版本
      const localVersion = await this.dataCollector.getLastSyncVersion();
      if (payload.metadata.version <= localVersion) {
        this.logger.info('Remote data is not newer', {
          localVersion,
          remoteVersion: payload.metadata.version,
        });
        return {
          success: true,
          operation,
          syncedCount: 0,
          conflictCount: 0,
          timestamp: Date.now(),
        };
      }

      // 应用远程数据
      await this.dataCollector.applyData(payload.data);
      await this.dataCollector.updateSyncVersion(payload.metadata.version);

      return {
        success: true,
        operation,
        syncedCount: this.countEntities(payload.data),
        conflictCount: 0,
        newVersion: payload.metadata.version,
        timestamp: Date.now(),
      };
    });
  }

  // ============ 自动同步 ============

  /**
   * 启动自动同步
   */
  startAutoSync(): void {
    if (this.autoSyncTimer) {
      this.stopAutoSync();
    }

    this.logger.info('Starting auto sync', { interval: this.config.autoSyncInterval });

    this.autoSyncTimer = setInterval(async () => {
      if (!this.isSyncing && this.activeProvider) {
        try {
          await this.fullSync();
        } catch (error) {
          this.logger.error('Auto sync failed', { error });
        }
      }
    }, this.config.autoSyncInterval);
  }

  /**
   * 停止自动同步
   */
  stopAutoSync(): void {
    if (this.autoSyncTimer) {
      clearInterval(this.autoSyncTimer);
      this.autoSyncTimer = null;
      this.logger.info('Auto sync stopped');
    }
  }

  // ============ 状态查询 ============

  /**
   * 获取当前同步状态
   */
  getStatus(): SyncStatus {
    return this.currentStatus;
  }

  /**
   * 是否正在同步
   */
  isSyncInProgress(): boolean {
    return this.isSyncing;
  }

  /**
   * 获取上次同步时间
   */
  getLastSyncTime(): number | null {
    return this.lastSyncTime;
  }

  /**
   * 获取设备信息
   */
  getDeviceInfo(): { deviceId: string; deviceName: string } {
    return {
      deviceId: this.deviceId,
      deviceName: this.deviceName,
    };
  }

  // ============ 清理 ============

  /**
   * 清理资源
   */
  cleanup(): void {
    this.stopAutoSync();
    this.providers.clear();
    this.activeProvider = null;
    this.dataCollector = null;
    this.removeAllListeners();
    this.logger.info('SyncManager cleaned up');
  }

  // ============ 私有方法 ============

  /**
   * 执行同步操作（带状态管理）
   */
  private async executeSync(
    operation: SyncOperation,
    syncFn: () => Promise<SyncResult>
  ): Promise<SyncResult> {
    if (this.isSyncing) {
      return {
        success: false,
        operation,
        syncedCount: 0,
        conflictCount: 0,
        error: 'SYNC_IN_PROGRESS',
        details: 'Another sync operation is already in progress',
        timestamp: Date.now(),
      };
    }

    this.isSyncing = true;
    this.setStatus('syncing');

    const startTime = Date.now();
    this.emit('sync:start', {
      operation,
      provider: this.activeProvider || 'unknown',
    });

    try {
      const result = await syncFn();

      this.lastSyncTime = Date.now();
      this.setStatus(result.success ? 'success' : 'error');

      this.emit('sync:complete', result);
      this.logger.info('Sync completed', {
        operation,
        success: result.success,
        duration: Date.now() - startTime,
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.setStatus('error');

      const result: SyncResult = {
        success: false,
        operation,
        syncedCount: 0,
        conflictCount: 0,
        error: errorMessage,
        timestamp: Date.now(),
      };

      this.emit('sync:error', { error: errorMessage });
      this.emit('sync:complete', result);

      this.logger.error('Sync failed', { operation, error: errorMessage });
      return result;
    } finally {
      this.isSyncing = false;
      // 延迟重置状态为 idle
      setTimeout(() => {
        if (this.currentStatus !== 'syncing') {
          this.setStatus('idle');
        }
      }, 3000);
    }
  }

  /**
   * 设置状态并发送事件
   */
  private setStatus(status: SyncStatus): void {
    if (this.currentStatus !== status) {
      this.currentStatus = status;
      this.emit('sync:status-changed', {
        status,
        provider: this.activeProvider || undefined,
      });
    }
  }

  /**
   * 创建同步负载
   */
  private createSyncPayload(data: SyncDataBundle, version: number): SyncPayload {
    const now = Date.now();

    const metadata: SyncMetadata = {
      lastSyncAt: now,
      version,
      checksum: this.calculateChecksum(data),
      deviceId: this.deviceId,
      deviceName: this.deviceName,
      createdAt: now,
      updatedAt: now,
    };

    return {
      formatVersion: SYNC_DATA_FORMAT_VERSION,
      metadata,
      data,
    };
  }

  /**
   * 计算数据校验和
   */
  private calculateChecksum(data: SyncDataBundle): string {
    const content = JSON.stringify(data);
    return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
  }

  /**
   * 计算实体数量
   */
  private countEntities(data: SyncDataBundle): number {
    return (
      (data.goals?.length || 0) +
      (data.tasks?.length || 0) +
      (data.schedules?.length || 0) +
      (data.reminders?.length || 0)
    );
  }

  /**
   * 生成设备 ID
   */
  private generateDeviceId(): string {
    const hostname = os.hostname();
    const platform = os.platform();
    const userDir = app?.getPath?.('userData') || os.homedir();

    const input = `${hostname}-${platform}-${userDir}`;
    return crypto.createHash('sha256').update(input).digest('hex').substring(0, 32);
  }
}

/**
 * 获取 SyncManager 实例
 */
export function getSyncManager(
  config?: Partial<SyncManagerConfig>,
  logger?: ILogger
): SyncManager {
  return SyncManager.getInstance(config, logger);
}
