/**
 * NetworkStateManager - 网络状态管理器
 *
 * 负责监控网络连接状态，自动切换离线/在线模式
 *
 * 核心功能：
 * - 监听网络状态变化
 * - 自动切换认证模式
 * - 网络恢复时自动刷新 Token
 * - 提供网络状态查询 API
 */

import { net, powerMonitor } from 'electron';
import { createLogger } from '@dailyuse/utils/logger';
import type { ILogger } from '@dailyuse/utils/logger';
import type {
  NetworkStatus,
  NetworkStateChangeEvent,
  NetworkCheckConfig,
} from '@dailyuse/contracts/authentication';
import { EventEmitter } from 'events';

/**
 * NetworkStateManager 配置（内部使用，扩展基础配置）
 */
export interface NetworkStateManagerConfig extends NetworkCheckConfig {
  // 可添加 Desktop 特有的配置项
}

const DEFAULT_CONFIG: Required<NetworkStateManagerConfig> = {
  checkInterval: 30000, // 30 秒
  healthCheckUrl: '', // 可配置
  enableHealthCheck: false,
  timeout: 5000,
};

/**
 * 网络状态管理器
 *
 * 提供网络状态监控、模式切换、事件通知功能
 */
export class NetworkStateManager extends EventEmitter {
  private readonly logger: ILogger;
  private readonly config: Required<NetworkStateManagerConfig>;

  private currentStatus: NetworkStatus = 'unknown';
  private checkTimer: NodeJS.Timeout | null = null;
  private isInitialized = false;

  // 回调函数（用于与 SessionManager 集成）
  private onOnlineCallback: (() => Promise<void>) | null = null;
  private onOfflineCallback: (() => Promise<void>) | null = null;

  constructor(config: NetworkStateManagerConfig = {}, logger?: ILogger) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.logger = logger || createLogger('NetworkStateManager');
  }

  // ============ Initialization ============

  /**
   * 初始化网络状态管理器
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      this.logger.warn('NetworkStateManager already initialized');
      return;
    }

    this.logger.info('Initializing NetworkStateManager');

    // 初始化网络状态
    this.currentStatus = this.checkNetworkStatus();
    this.logger.info('Initial network status', { status: this.currentStatus });

    // 监听电源状态变化（唤醒后检查网络）
    powerMonitor.on('resume', () => this.handleSystemResume());

    // 启动定期健康检查
    if (this.config.enableHealthCheck === true) {
      this.startHealthCheck();
    }

    this.isInitialized = true;
    this.logger.info('NetworkStateManager initialized');
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    this.logger.info('Cleaning up NetworkStateManager');

    this.stopHealthCheck();
    this.removeAllListeners();

    this.isInitialized = false;
  }

  // ============ Status Management ============

  /**
   * 获取当前网络状态
   */
  getStatus(): NetworkStatus {
    return this.currentStatus;
  }

  /**
   * 检查是否在线
   */
  isOnline(): boolean {
    return this.currentStatus === 'online';
  }

  /**
   * 检查是否离线
   */
  isOffline(): boolean {
    return this.currentStatus === 'offline';
  }

  /**
   * 手动检查网络状态
   */
  checkNetworkStatus(): NetworkStatus {
    try {
      // Electron 的 net.isOnline() 提供基本的网络检测
      const online = net.isOnline();
      return online ? 'online' : 'offline';
    } catch (error) {
      this.logger.warn('Failed to check network status', { error });
      return 'unknown';
    }
  }

  /**
   * 强制刷新网络状态
   */
  async refreshStatus(): Promise<NetworkStatus> {
    const previousStatus = this.currentStatus;
    this.currentStatus = this.checkNetworkStatus();

    if (previousStatus !== this.currentStatus) {
      await this.handleStatusChange(previousStatus, this.currentStatus);
    }

    return this.currentStatus;
  }

  // ============ Callbacks ============

  /**
   * 设置上线回调
   */
  setOnOnline(callback: () => Promise<void>): void {
    this.onOnlineCallback = callback;
  }

  /**
   * 设置离线回调
   */
  setOnOffline(callback: () => Promise<void>): void {
    this.onOfflineCallback = callback;
  }

  // ============ Private Methods ============

  /**
   * 处理状态变化
   */
  private async handleStatusChange(
    previousStatus: NetworkStatus,
    newStatus: NetworkStatus,
  ): Promise<void> {
    this.logger.info('Network status changed', { from: previousStatus, to: newStatus });

    const event: NetworkStateChangeEvent = {
      status: newStatus,
      previousStatus,
      timestamp: Date.now(),
    };

    // 触发事件
    this.emit('statusChange', event);

    if (newStatus === 'online') {
      this.emit('online', event);
      await this.handleOnline();
    } else if (newStatus === 'offline') {
      this.emit('offline', event);
      await this.handleOffline();
    }
  }

  /**
   * 处理上线
   */
  private async handleOnline(): Promise<void> {
    this.logger.info('Network came online');

    try {
      if (this.onOnlineCallback) {
        await this.onOnlineCallback();
      }
    } catch (error) {
      this.logger.error('Failed to handle online event', { error });
    }
  }

  /**
   * 处理离线
   */
  private async handleOffline(): Promise<void> {
    this.logger.info('Network went offline');

    try {
      if (this.onOfflineCallback) {
        await this.onOfflineCallback();
      }
    } catch (error) {
      this.logger.error('Failed to handle offline event', { error });
    }
  }

  /**
   * 处理系统唤醒
   */
  private async handleSystemResume(): Promise<void> {
    this.logger.info('System resumed from sleep, checking network status');

    // 延迟检查，等待网络恢复
    setTimeout(async () => {
      await this.refreshStatus();
    }, 2000);
  }

  /**
   * 启动健康检查
   */
  private startHealthCheck(): void {
    if (this.checkTimer) {
      return;
    }

    this.checkTimer = setInterval(async () => {
      await this.refreshStatus();
    }, this.config.checkInterval || 30000);
    this.checkTimer.unref?.();

    this.logger.info('Health check started', { interval: this.config.checkInterval || 30000 });
  }

  /**
   * 停止健康检查
   */
  private stopHealthCheck(): void {
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
      this.checkTimer = null;
      this.logger.info('Health check stopped');
    }
  }
}
