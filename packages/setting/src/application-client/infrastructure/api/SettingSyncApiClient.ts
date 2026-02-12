import axios from 'axios';
import type { AxiosInstance } from 'axios';
import type { UserSettingClientDTO, UpdateUserSettingRequest } from '@dailyuse/contracts/setting';


/**
 * Setting Sync API Client
 * Handles cloud synchronization, version management, and conflict resolution
 */
export class SettingSyncApiClient {
  private client: AxiosInstance;
  private baseURL = '/api/v1/settings/sync';

  constructor(axiosInstance: AxiosInstance) {
    this.client = axiosInstance;
  }

  /**
   * Save a setting version snapshot
   */
  async saveVersion(
    deviceId: string,
    deviceName: string,
    snapshot: UserSettingClientDTO
  ) {
    const response = await this.client.post(`${this.baseURL}/save-version`, {
      deviceId,
      deviceName,
      snapshot,
    });
    return response.data;
  }

  /**
   * Get setting version history
   */
  async getHistory(limit: number = 10) {
    const response = await this.client.get(`${this.baseURL}/history`, {
      params: { limit },
    });
    return response.data;
  }

  /**
   * Restore settings from a specific version
   */
  async restoreVersion(versionUuid: string) {
    const response = await this.client.post(`${this.baseURL}/restore`, {
      versionUuid,
    });
    return response.data;
  }

  /**
   * Resolve conflict between local and remote settings
   */
  async resolveConflict(
    local: UserSettingClientDTO,
    remote: UserSettingClientDTO,
    strategy: 'local' | 'remote' | 'merge'
  ) {
    const response = await this.client.post(
      `${this.baseURL}/resolve-conflict`,
      {
        local,
        remote,
        strategy,
      }
    );
    return response.data;
  }

  /**
   * Get synchronization status
   */
  async getSyncStatus() {
    const response = await this.client.get(`${this.baseURL}/status`);
    return response.data;
  }

  /**
   * Clean up old versions
   */
  async cleanupVersions(keepCount: number = 20) {
    const response = await this.client.delete(`${this.baseURL}/cleanup`, {
      params: { keepCount },
    });
    return response.data;
  }
}


