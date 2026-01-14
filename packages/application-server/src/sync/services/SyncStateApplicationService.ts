/**
 * SyncState Application Service
 *
 * 同步状态聚合服务
 *
 * 职责：
 * - 提供同步状态概览
 * - 聚合多个服务的数据
 */

import { SyncProfileApplicationService } from './SyncProfileApplicationService';
import { SyncSessionApplicationService } from './SyncSessionApplicationService';
import { PendingChangeApplicationService } from './PendingChangeApplicationService';
import { SyncConflictApplicationService } from './SyncConflictApplicationService';
import type {
  SyncStatusResponse,
  SyncStateClientDTO,
} from '@dailyuse/contracts/sync';
import { SyncGlobalStatus } from '@dailyuse/contracts/sync';

/**
 * SyncState Application Service
 *
 * 聚合同步相关状态的服务
 */
export class SyncStateApplicationService {
  constructor(
    private readonly profileService: SyncProfileApplicationService,
    private readonly sessionService: SyncSessionApplicationService,
    private readonly changeService: PendingChangeApplicationService,
    private readonly conflictService: SyncConflictApplicationService,
    private readonly accountUuid: string,
  ) {}

  /**
   * 获取同步状态概览
   */
  async getSyncStatus(): Promise<SyncStatusResponse> {
    // 并行获取各类数据
    const [
      currentSession,
      defaultProfile,
      pendingConflictsCount,
      pendingChangesCount,
    ] = await Promise.all([
      this.sessionService.getCurrentSession(),
      this.profileService.getDefaultProfile(),
      this.conflictService.getUnresolvedCount(),
      this.changeService.getPendingCount(),
    ]);

    // 确定全局状态
    let globalStatus: SyncGlobalStatus;
    if (currentSession) {
      globalStatus = SyncGlobalStatus.SYNCING;
    } else if (pendingConflictsCount > 0) {
      globalStatus = SyncGlobalStatus.CONFLICT;
    } else if (pendingChangesCount > 0) {
      globalStatus = SyncGlobalStatus.PENDING;
    } else {
      globalStatus = SyncGlobalStatus.IDLE;
    }

    const state: SyncStateClientDTO = {
      globalStatus,
      currentSessionId: currentSession?.uuid ?? null,
      activeProfileId: defaultProfile?.uuid ?? null,
      statusLabel: this.getStatusLabel(globalStatus),
      lastSyncAt: defaultProfile?.lastSyncAt ?? null,
      lastSyncResult: defaultProfile?.lastSyncResult ?? null,
      pendingChangesCount,
      unresolvedConflictsCount: pendingConflictsCount,
      isOnline: true, // TODO: 实际检测网络状态
    };

    return {
      state,
      currentSession: currentSession ?? undefined,
      pendingConflictsCount,
      pendingChangesCount,
    };
  }

  /**
   * 检查是否可以开始同步
   */
  async canStartSync(): Promise<{ canStart: boolean; reason?: string }> {
    // 检查是否有进行中的会话
    const currentSession = await this.sessionService.getCurrentSession();
    if (currentSession) {
      return { canStart: false, reason: '已有同步正在进行中' };
    }

    // 检查是否有默认配置
    const defaultProfile = await this.profileService.getDefaultProfile();
    if (!defaultProfile) {
      return { canStart: false, reason: '未配置同步配置文件' };
    }

    // 检查配置是否可用
    if (!defaultProfile.isActive) {
      return { canStart: false, reason: '同步配置已停用' };
    }

    if (!defaultProfile.isConnected) {
      return { canStart: false, reason: '同步服务未连接' };
    }

    return { canStart: true };
  }

  /**
   * 获取同步摘要统计
   */
  async getSyncSummary(): Promise<{
    totalProfiles: number;
    activeProfiles: number;
    totalSessions: number;
    pendingChanges: number;
    unresolvedConflicts: number;
  }> {
    const [profiles, activeProfiles, history, pendingChanges, conflicts] = await Promise.all([
      this.profileService.listProfiles(),
      this.profileService.getActiveProfiles(),
      this.sessionService.getSyncHistory({ pageSize: 1000 }),
      this.changeService.getPendingCount(),
      this.conflictService.getUnresolvedCount(),
    ]);

    return {
      totalProfiles: profiles.profiles.length,
      activeProfiles: activeProfiles.length,
      totalSessions: history.total,
      pendingChanges,
      unresolvedConflicts: conflicts,
    };
  }

  /**
   * 获取状态标签
   */
  private getStatusLabel(status: SyncGlobalStatus): 'idle' | 'syncing' | 'error' | 'offline' | 'conflict' {
    switch (status) {
      case SyncGlobalStatus.SYNCING:
        return 'syncing';
      case SyncGlobalStatus.CONFLICT:
        return 'conflict';
      case SyncGlobalStatus.ERROR:
        return 'error';
      case SyncGlobalStatus.OFFLINE:
        return 'offline';
      default:
        return 'idle';
    }
  }
}
