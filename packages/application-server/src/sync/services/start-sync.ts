/**
 * Start Sync Service
 *
 * 启动同步会话的应用服务
 */

import {
  SyncSession,
  SyncProfile,
  SyncVersion,
  type ISyncSessionRepository,
  type ISyncProfileRepository,
} from '@dailyuse/domain-server/sync';
import {
  SyncStrategy,
  SyncDirection,
  type StartSyncReq,
  type StartSyncRes,
  type DeviceInfoDTO,
} from '@dailyuse/contracts/sync';
import { eventBus } from '@dailyuse/utils';

/**
 * Start Sync Service
 */
export class StartSync {
  constructor(
    private readonly sessionRepository: ISyncSessionRepository,
    private readonly profileRepository: ISyncProfileRepository,
  ) {}

  async execute(
    accountUuid: string,
    deviceInfo: DeviceInfoDTO,
    request: StartSyncReq,
  ): Promise<StartSyncRes> {
    // 1. 获取配置文件
    let profile: SyncProfile | null = null;
    if (request.profileId) {
      profile = await this.profileRepository.findByUuid(request.profileId);
    } else {
      profile = await this.profileRepository.findDefault(accountUuid);
    }

    if (!profile) {
      throw new Error('未找到同步配置，请先创建同步配置');
    }

    if (!profile.canSync()) {
      throw new Error(`同步配置 "${profile.name}" 无法同步: ${profile.statusLabel}`);
    }

    // 2. 检查是否已有进行中的会话
    const inProgressSessions = await this.sessionRepository.findInProgress(accountUuid);
    if (inProgressSessions.length > 0) {
      throw new Error('已有同步正在进行中，请等待完成或取消');
    }

    // 3. 确定同步参数 - 使用配置文件中的值
    const direction = profile.syncConfig.direction;
    const strategy = SyncStrategy.Auto;

    // 4. 创建起始版本
    let startVersionDTO: import('@dailyuse/contracts/sync').SyncVersionServerDTO;
    if (profile.lastSyncVersion) {
      // lastSyncVersion is already a DTO from the profile - just use it directly
      startVersionDTO = profile.lastSyncVersion as import('@dailyuse/contracts/sync').SyncVersionServerDTO;
    } else {
      // Create a new initial version
      const now = Date.now();
      startVersionDTO = {
        logicalVersion: 0,
        vectorClock: [{ deviceId: deviceInfo.deviceId, version: 1, updatedAt: now }],
        lastModifiedBy: deviceInfo.deviceId,
        lastModifiedAt: now,
      };
    }

    // 5. 创建会话
    const session = SyncSession.create({
      profileId: profile.id,
      direction,
      strategy,
      triggerType: 'Manual',
      triggerDevice: deviceInfo,
      startVersion: startVersionDTO,
    });

    // 6. 持久化
    await this.sessionRepository.save(session);

    // 7. 发布事件
    await (eventBus as any).send('sync.session.started', {
      sessionId: session.id,
      profileId: profile.id,
      accountUuid,
      direction,
      strategy,
    });

    return {
      syncSessionId: session.id,
      status: 'PENDING',
      startedAt: Date.now(),
    };
  }
}
