/**
 * Auto Update IPC Client
 *
 * Story 13.51: 自动更新集成
 *
 * IPC client for auto-update operations from renderer process
 *
 * @module modules/auto-update/infrastructure
 */

import { BaseIPCClient } from '../../../shared/infrastructure/ipc/base-ipc-client';

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
 * Update progress
 */
export interface UpdateProgress {
  percent: number;
  bytesPerSecond: number;
  total: number;
  transferred: number;
}

/**
 * Update configuration
 */
export interface UpdateConfig {
  autoCheck: boolean;
  autoDownload: boolean;
  autoInstall: boolean;
  checkInterval: number;
  showNotifications: boolean;
  updateServerUrl?: string;
}

/**
 * Update status response
 */
export interface UpdateStatusResponse {
  status: UpdateStatus;
  updateInfo: UpdateInfo | null;
  progress: UpdateProgress | null;
}

/**
 * Auto Update IPC Client
 *
 * Provides typed interface for auto-update IPC operations
 */
export class AutoUpdateIPCClient extends BaseIPCClient {
  constructor() {
    super({ metadata: { module: 'auto-update' } });
  }

  /**
   * Check for available updates
   */
  async checkForUpdates(): Promise<UpdateInfo | null> {
    return this.invoke<UpdateInfo | null>('auto-update:check');
  }

  /**
   * Download the available update
   */
  async downloadUpdate(): Promise<boolean> {
    const result = await this.invoke<{ ok: boolean }>('auto-update:download');
    return result?.ok ?? false;
  }

  /**
   * Quit and install the downloaded update
   */
  async quitAndInstall(): Promise<void> {
    await this.invoke<void>('auto-update:install');
  }

  /**
   * Get current update status
   */
  async getStatus(): Promise<UpdateStatusResponse> {
    return this.invoke<UpdateStatusResponse>('auto-update:status') ?? {
      status: UpdateStatus.Idle,
      updateInfo: null,
      progress: null,
    };
  }

  /**
   * Update configuration
   */
  async updateConfig(config: Partial<UpdateConfig>): Promise<void> {
    await this.invoke<void>('auto-update:config', config);
  }
}

// Singleton instance
export const autoUpdateClient = new AutoUpdateIPCClient();
