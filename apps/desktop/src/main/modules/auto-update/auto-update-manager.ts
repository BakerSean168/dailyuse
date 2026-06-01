/**
 * Auto Update Manager
 *
 * Story 13.51: 自动更新集成
 *
 * 管理应用程序的自动更新检查、下载和安装
 * 支持后台静默更新和用户确认更新两种模式
 *
 * @module modules/auto-update
 */

import { BrowserWindow, app } from 'electron';
import { createLogger } from '@dailyuse/utils/logger';
import type { AppUpdater, UpdateInfo as ElectronUpdateInfo } from 'electron-updater';

const logger = createLogger('AutoUpdateManager');

/**
 * Update configuration options
 */
export interface UpdateConfig {
  /** Whether to check for updates automatically on startup */
  autoCheck: boolean;
  /** Whether to download updates automatically */
  autoDownload: boolean;
  /** Whether to install updates silently on quit */
  autoInstall: boolean;
  /** Update check interval in milliseconds (default: 1 hour) */
  checkInterval: number;
  /** Whether to show update notifications to user */
  showNotifications: boolean;
  /** Custom update server URL (optional, uses GitHub releases by default) */
  updateServerUrl?: string;
}

/**
 * Update progress information
 */
export interface UpdateProgress {
  /** Progress percentage (0-100) */
  percent: number;
  /** Bytes downloaded */
  bytesPerSecond: number;
  /** Total bytes to download */
  total: number;
  /** Bytes transferred so far */
  transferred: number;
}

/**
 * Update information
 */
export interface UpdateInfo {
  version: string;
  releaseDate: string;
  releaseNotes?: string;
  releaseName?: string;
}

/**
 * Update status enum
 */
export enum UpdateStatus {
  Idle = 'idle',
  Checking = 'checking',
  Available = 'available',
  NotAvailable = 'not-available',
  Downloading = 'downloading',
  Downloaded = 'downloaded',
  Error = 'error',
}

const DEFAULT_CONFIG: UpdateConfig = {
  autoCheck: true,
  autoDownload: false,
  autoInstall: true,
  checkInterval: 60 * 60 * 1000, // 1 hour
  showNotifications: true,
};

/**
 * AutoUpdateManager class
 *
 * Handles all auto-update functionality using electron-updater
 * Note: electron-updater is optional and will be loaded dynamically
 */
export class AutoUpdateManager {
  private config: UpdateConfig;
  private status: UpdateStatus = UpdateStatus.Idle;
  private updateInfo: UpdateInfo | null = null;
  private progress: UpdateProgress | null = null;
  private checkIntervalId: ReturnType<typeof setInterval> | null = null;
  private mainWindow: BrowserWindow | null = null;
  private autoUpdater: AppUpdater | null = null;

  constructor(config?: Partial<UpdateConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Initialize the auto-update manager
   * Dynamically loads electron-updater if available
   */
  async init(mainWindow?: BrowserWindow): Promise<boolean> {
    this.mainWindow = mainWindow || null;

    // Don't run auto-updater in development mode
    if (!app.isPackaged) {
      logger.info('Auto-updater disabled in development mode');
      return false;
    }

    try {
      // Dynamically import electron-updater
      const { autoUpdater } = await import('electron-updater');
      this.autoUpdater = autoUpdater;

      // Configure auto-updater
      this.autoUpdater.autoDownload = this.config.autoDownload;
      this.autoUpdater.autoInstallOnAppQuit = this.config.autoInstall;

      if (this.config.updateServerUrl) {
        this.autoUpdater.setFeedURL(this.config.updateServerUrl);
      }

      // Set up event listeners
      this.setupEventListeners();

      // Start periodic check if enabled
      if (this.config.autoCheck) {
        this.startPeriodicCheck();
        // Also check immediately on startup
        setTimeout(() => this.checkForUpdates(), 5000);
      }

      logger.info('Auto-update manager initialized', { config: this.config });
      return true;
    } catch (error) {
      logger.warn('electron-updater not available, auto-update disabled', { error });
      return false;
    }
  }

  /**
   * Set up electron-updater event listeners
   */
  private setupEventListeners(): void {
    if (!this.autoUpdater) return;

    this.autoUpdater.on('checking-for-update', () => {
      this.status = UpdateStatus.Checking;
      this.notifyRenderer('update:checking');
      logger.info('Checking for updates...');
    });

    this.autoUpdater.on('update-available', (info: ElectronUpdateInfo) => {
      const updateInfo = this.normalizeUpdateInfo(info);
      this.status = UpdateStatus.Available;
      this.updateInfo = updateInfo;
      this.notifyRenderer('update:available', updateInfo);
      logger.info('Update available', { version: updateInfo.version });
    });

    this.autoUpdater.on('update-not-available', (info: ElectronUpdateInfo) => {
      const updateInfo = this.normalizeUpdateInfo(info);
      this.status = UpdateStatus.NotAvailable;
      this.updateInfo = updateInfo;
      this.notifyRenderer('update:not-available', updateInfo);
      logger.info('Update not available, current version is up-to-date');
    });

    this.autoUpdater.on('download-progress', (progress: UpdateProgress) => {
      this.status = UpdateStatus.Downloading;
      this.progress = progress;
      this.notifyRenderer('update:progress', progress);
      logger.debug('Download progress', { percent: progress.percent.toFixed(2) });
    });

    this.autoUpdater.on('update-downloaded', (info: ElectronUpdateInfo) => {
      const updateInfo = this.normalizeUpdateInfo(info);
      this.status = UpdateStatus.Downloaded;
      this.updateInfo = updateInfo;
      this.progress = null;
      this.notifyRenderer('update:downloaded', updateInfo);
      logger.info('Update downloaded', { version: updateInfo.version });
    });

    this.autoUpdater.on('error', (error: Error) => {
      this.status = UpdateStatus.Error;
      this.notifyRenderer('update:error', { message: error.message });
      logger.error('Update error', { error });
    });
  }

  /**
   * Send update event to renderer process
   */
  private notifyRenderer(channel: string, data?: unknown): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(channel, data);
    }
  }

  /**
   * Start periodic update checks
   */
  private startPeriodicCheck(): void {
    if (this.checkIntervalId) {
      clearInterval(this.checkIntervalId);
    }

    this.checkIntervalId = setInterval(() => {
      this.checkForUpdates();
    }, this.config.checkInterval);
  }

  /**
   * Stop periodic update checks
   */
  stopPeriodicCheck(): void {
    if (this.checkIntervalId) {
      clearInterval(this.checkIntervalId);
      this.checkIntervalId = null;
    }
  }

  /**
   * Check for available updates
   */
  async checkForUpdates(): Promise<UpdateInfo | null> {
    if (!this.autoUpdater) {
      logger.warn('Auto-updater not initialized');
      return null;
    }

    if (this.status === UpdateStatus.Checking || this.status === UpdateStatus.Downloading) {
      logger.debug('Update check already in progress');
      return this.updateInfo;
    }

    try {
      const result = await this.autoUpdater.checkForUpdates();
      return result?.updateInfo ? this.normalizeUpdateInfo(result.updateInfo) : null;
    } catch (error) {
      logger.error('Failed to check for updates', { error });
      return null;
    }
  }

  /**
   * Download the available update
   */
  async downloadUpdate(): Promise<boolean> {
    if (!this.autoUpdater) {
      logger.warn('Auto-updater not initialized');
      return false;
    }

    if (this.status !== UpdateStatus.Available) {
      logger.warn('No update available to download');
      return false;
    }

    try {
      await this.autoUpdater.downloadUpdate();
      return true;
    } catch (error) {
      logger.error('Failed to download update', { error });
      return false;
    }
  }

  /**
   * Quit and install the downloaded update
   */
  quitAndInstall(): void {
    if (!this.autoUpdater) {
      logger.warn('Auto-updater not initialized');
      return;
    }

    if (this.status !== UpdateStatus.Downloaded) {
      logger.warn('No update downloaded to install');
      return;
    }

    logger.info('Quitting and installing update...');
    this.autoUpdater.quitAndInstall();
  }

  /**
   * Get current update status
   */
  getStatus(): {
    status: UpdateStatus;
    updateInfo: UpdateInfo | null;
    progress: UpdateProgress | null;
  } {
    return {
      status: this.status,
      updateInfo: this.updateInfo,
      progress: this.progress,
    };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<UpdateConfig>): void {
    this.config = { ...this.config, ...config };

    if (this.autoUpdater) {
      this.autoUpdater.autoDownload = this.config.autoDownload;
      this.autoUpdater.autoInstallOnAppQuit = this.config.autoInstall;
    }

    // Restart periodic check if interval changed
    if (config.checkInterval !== undefined && this.config.autoCheck) {
      this.startPeriodicCheck();
    }

    logger.info('Update config updated', { config: this.config });
  }

  /**
   * Set the main window reference
   */
  setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window;
  }

  private normalizeUpdateInfo(info: ElectronUpdateInfo): UpdateInfo {
    const releaseNotes = Array.isArray(info.releaseNotes)
      ? info.releaseNotes.map((item) => item.note).join('\n')
      : info.releaseNotes ?? undefined;

    return {
      version: info.version,
      releaseDate: info.releaseDate,
      releaseNotes: releaseNotes ?? undefined,
      releaseName: info.releaseName ?? undefined,
    };
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.stopPeriodicCheck();
    this.mainWindow = null;
    this.autoUpdater = null;
    logger.info('Auto-update manager destroyed');
  }
}

export function createAutoUpdateManager(config?: Partial<UpdateConfig>): AutoUpdateManager {
  return new AutoUpdateManager(config);
}
