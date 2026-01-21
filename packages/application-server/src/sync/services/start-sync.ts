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
  type StartSyncRequest,
  type StartSyncResponse,
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

  /**
   * 获取服务单例
   */
  static getInstance(): StartSync {
    if (!StartSync.instance) {
      StartSync.instance = StartSync.createInstance();
    }
    return StartSync.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    StartSync.instance = undefined as unknown as StartSync;
  }

  async execute(accountUuid: string, deviceInfo: DeviceInfoDTO, request: StartSyncRequest): Promise<StartSyncResponse> {
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

    // 3. 确定同步参数
    const direction = request.direction ?? profile.syncConfig.direction;
    const strategy = request.forceFullSync 
      ? SyncStrategy.FULL 
      : (request.strategy ?? SyncStrategy.AUTO);

    // 4. 创建起始版本
    const startVersion = profile.lastSyncVersion ?? SyncVersion.create(deviceInfo.deviceId).toServerDTO();

    // 5. 创建会话
    const session = SyncSession.create({
      profileId: profile.uuid,
      direction,
      strategy,
      triggerType: request.triggerType,
      triggerDevice: deviceInfo,
      startVersion,
    });

    // 6. 持久化
    await this.sessionRepository.save(session);

    // 7. 发布事件
    await eventBus.emit('sync.session.started', {
      sessionId: session.uuid,
      profileId: profile.uuid,
      accountUuid,
      direction,
      strategy,
      triggerType: request.triggerType,
    });

    return {
      sessionId: session.uuid,
      session: session.toClientDTO(),
    };
  }
}

/**
 * 便捷函数：启动同步
 */
export const startSync = (
  accountUuid: string,
  deviceInfo: DeviceInfoDTO,
  request: StartSyncRequest,
): Promise<StartSyncResponse> =>
  StartSync.getInstance().execute(accountUuid, deviceInfo, request);
