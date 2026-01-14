/**
 * Get Sync Status Use Case
 *
 * 获取同步状态用例
 */

import { SyncStateApplicationService } from '../services/SyncStateApplicationService';
import { SyncProfileApplicationService } from '../services/SyncProfileApplicationService';
import { SyncSessionApplicationService } from '../services/SyncSessionApplicationService';
import { PendingChangeApplicationService } from '../services/PendingChangeApplicationService';
import { SyncConflictApplicationService } from '../services/SyncConflictApplicationService';
import type {
  ISyncProfileRepository,
  ISyncSessionRepository,
  IPendingChangeRepository,
  ISyncConflictRepository,
} from '@dailyuse/domain-server/sync';
import type {
  SyncStatusResponse,
  DeviceInfoDTO,
} from '@dailyuse/contracts/sync';

/**
 * Get Sync Status Use Case
 */
export class GetSyncStatusUseCase {
  private stateService: SyncStateApplicationService;

  constructor(
    profileRepository: ISyncProfileRepository,
    sessionRepository: ISyncSessionRepository,
    changeRepository: IPendingChangeRepository,
    conflictRepository: ISyncConflictRepository,
    accountUuid: string,
    deviceInfo: DeviceInfoDTO,
  ) {
    const profileService = new SyncProfileApplicationService(profileRepository, accountUuid);
    const sessionService = new SyncSessionApplicationService(
      sessionRepository,
      profileRepository,
      accountUuid,
      deviceInfo,
    );
    const changeService = new PendingChangeApplicationService(changeRepository, accountUuid);
    const conflictService = new SyncConflictApplicationService(conflictRepository, accountUuid);

    this.stateService = new SyncStateApplicationService(
      profileService,
      sessionService,
      changeService,
      conflictService,
      accountUuid,
    );
  }

  /**
   * 获取同步状态
   */
  async execute(): Promise<SyncStatusResponse> {
    return this.stateService.getSyncStatus();
  }

  /**
   * 检查是否可以开始同步
   */
  async canStartSync(): Promise<{ canStart: boolean; reason?: string }> {
    return this.stateService.canStartSync();
  }
}
