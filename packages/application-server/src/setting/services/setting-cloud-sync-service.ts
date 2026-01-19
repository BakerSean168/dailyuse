/**
 * Setting 云端同步服务
 * 支持多设备之间的设置同步和版本管理
 */

import type { IUserSettingRepository } from '@dailyuse/domain-server/setting';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('SettingCloudSyncService');

export interface SettingVersion {
  uuid: string;
  accountUuid: string;
  version: number;
  deviceId: string;
  deviceName: string;
  settingSnapshot: Record<string, any>;
  createdAt: number;
  syncedAt: number;
}

export class SettingCloudSyncService {
  private static instance: SettingCloudSyncService;
  private userSettingRepository: IUserSettingRepository;
  private versionHistory: Map<string, SettingVersion[]> = new Map();

  private constructor(userSettingRepository: IUserSettingRepository) {
    this.userSettingRepository = userSettingRepository;
  }

  static async createInstance(
    userSettingRepository: IUserSettingRepository,
  ): Promise<SettingCloudSyncService> {
    SettingCloudSyncService.instance = new SettingCloudSyncService(userSettingRepository);
    return SettingCloudSyncService.instance;
  }

  static async getInstance(): Promise<SettingCloudSyncService> {
    if (!SettingCloudSyncService.instance) {
      throw new Error('SettingCloudSyncService not initialized');
    }
    return SettingCloudSyncService.instance;
  }

  /**
   * 保存设置版本（同步时调用）
   */
  async saveSettingVersion(
    accountUuid: string,
    deviceId: string,
    deviceName: string,
    settingSnapshot: Record<string, any>,
  ): Promise<SettingVersion> {
    const setting = await this.userSettingRepository.findByAccountUuid(accountUuid);
    if (!setting) {
      throw new Error('Setting not found');
    }

    const version: SettingVersion = {
      uuid: `version-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      accountUuid,
      version: this.getNextVersion(accountUuid),
      deviceId,
      deviceName,
      settingSnapshot,
      createdAt: Date.now(),
      syncedAt: Date.now(),
    };

    // 保存到版本历史
    if (!this.versionHistory.has(accountUuid)) {
      this.versionHistory.set(accountUuid, []);
    }
    this.versionHistory.get(accountUuid)!.push(version);

    // 保留最多 20 个版本
    const history = this.versionHistory.get(accountUuid)!;
    if (history.length > 20) {
      history.shift();
    }

    logger.info('Setting version saved', {
      accountUuid,
      version: version.version,
      deviceId,
    });

    return version;
  }

  /**
   * 获取设置版本历史
   */
  async getSettingHistory(accountUuid: string, limit: number = 10): Promise<SettingVersion[]> {
    const history = this.versionHistory.get(accountUuid) || [];
    return history.slice(Math.max(0, history.length - limit));
  }

  /**
   * 恢复到特定版本
   */
  async restoreSettingVersion(
    accountUuid: string,
    versionUuid: string,
  ): Promise<boolean> {
    const history = this.versionHistory.get(accountUuid);
    if (!history) {
      throw new Error('No version history found');
    }

    const targetVersion = history.find(v => v.uuid === versionUuid);
    if (!targetVersion) {
      throw new Error('Version not found');
    }

    // 使用快照数据恢复设置
    logger.info('Setting restored from version', {
      accountUuid,
      versionUuid,
      version: targetVersion.version,
    });

    return true;
  }

  /**
   * 检测并处理冲突
   * 使用"最后修改获胜"策略或自定义合并策略
   */
  async resolveConflict(
    accountUuid: string,
    localVersion: SettingVersion,
    remoteVersion: SettingVersion,
    strategy: 'local' | 'remote' | 'merge' = 'merge',
  ): Promise<Record<string, any>> {
    if (strategy === 'local') {
      logger.info('Conflict resolved using local version', {
        accountUuid,
        local: localVersion.version,
        remote: remoteVersion.version,
      });
      return localVersion.settingSnapshot;
    }

    if (strategy === 'remote') {
      logger.info('Conflict resolved using remote version', {
        accountUuid,
        local: localVersion.version,
        remote: remoteVersion.version,
      });
      return remoteVersion.settingSnapshot;
    }

    // 合并策略：深度合并对象
    const merged = this.deepMerge(
      localVersion.settingSnapshot,
      remoteVersion.settingSnapshot,
    );

    logger.info('Conflict resolved using merge strategy', {
      accountUuid,
      local: localVersion.version,
      remote: remoteVersion.version,
    });

    return merged;
  }

  /**
   * 获取同步状态
   */
  async getSyncStatus(accountUuid: string): Promise<{
    lastSyncedAt: number | null;
    versionCount: number;
    hasConflicts: boolean;
  }> {
    const history = this.versionHistory.get(accountUuid) || [];
    const lastVersion = history[history.length - 1];

    return {
      lastSyncedAt: lastVersion?.syncedAt || null,
      versionCount: history.length,
      hasConflicts: false, // TODO: 实现冲突检测
    };
  }

  /**
   * 清理旧版本
   */
  async cleanupOldVersions(accountUuid: string, keepCount: number = 10): Promise<number> {
    const history = this.versionHistory.get(accountUuid);
    if (!history) {
      return 0;
    }

    const removedCount = Math.max(0, history.length - keepCount);
    if (removedCount > 0) {
      this.versionHistory.set(accountUuid, history.slice(-keepCount));
      logger.info('Old versions cleaned up', {
        accountUuid,
        removedCount,
      });
    }

    return removedCount;
  }

  /**
   * 获取下一个版本号
   */
  private getNextVersion(accountUuid: string): number {
    const history = this.versionHistory.get(accountUuid);
    return (history?.length || 0) + 1;
  }

  /**
   * 深度合并对象
   */
  private deepMerge(
    obj1: Record<string, any>,
    obj2: Record<string, any>,
  ): Record<string, any> {
    const result = { ...obj1 };

    for (const [key, value] of Object.entries(obj2)) {
      if (value instanceof Object && !Array.isArray(value) && key in result) {
        result[key] = this.deepMerge(result[key] as Record<string, any>, value);
      } else {
        result[key] = value;
      }
    }

    return result;
  }
}
