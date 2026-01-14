/**
 * Start Sync Use Case
 *
 * 启动同步用例
 */

import { SyncSessionApplicationService } from '../services/SyncSessionApplicationService';
import { SyncProfileApplicationService } from '../services/SyncProfileApplicationService';
import { PendingChangeApplicationService } from '../services/PendingChangeApplicationService';
import type {
  ISyncSessionRepository,
  ISyncProfileRepository,
  IPendingChangeRepository,
} from '@dailyuse/domain-server/sync';
import type {
  StartSyncRequest,
  StartSyncResponse,
  DeviceInfoDTO,
} from '@dailyuse/contracts/sync';

/**
 * Start Sync Use Case
 */
export class StartSyncUseCase {
  private sessionService: SyncSessionApplicationService;
  private profileService: SyncProfileApplicationService;
  private changeService: PendingChangeApplicationService;

  constructor(
    sessionRepository: ISyncSessionRepository,
    profileRepository: ISyncProfileRepository,
    changeRepository: IPendingChangeRepository,
    accountUuid: string,
    deviceInfo: DeviceInfoDTO,
  ) {
    this.sessionService = new SyncSessionApplicationService(
      sessionRepository,
      profileRepository,
      accountUuid,
      deviceInfo,
    );
    this.profileService = new SyncProfileApplicationService(
      profileRepository,
      accountUuid,
    );
    this.changeService = new PendingChangeApplicationService(
      changeRepository,
      accountUuid,
    );
  }

  /**
   * 执行启动同步
   */
  async execute(request: StartSyncRequest): Promise<StartSyncResponse> {
    // 1. 检查是否有待同步变更
    const hasPending = await this.changeService.hasPendingChanges();
    if (!hasPending && !request.forceFullSync) {
      // 没有待同步内容，可能需要提示用户
      console.log('No pending changes to sync');
    }

    // 2. 启动同步会话
    return this.sessionService.startSync(request);
  }
}
