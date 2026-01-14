/**
 * SyncSession Application Service
 *
 * 同步会话应用服务
 *
 * 职责：
 * - 启动同步会话
 * - 取消同步会话
 * - 重试同步会话
 * - 获取会话状态和历史
 */

import {
  SyncSession,
  SyncProfile,
  SyncVersion,
  SyncDeviceInfo,
  type ISyncSessionRepository,
  type ISyncProfileRepository,
} from '@dailyuse/domain-server/sync';
import {
  SyncSessionStatus,
  SyncDirection,
  SyncStrategy,
  SyncTriggerType,
  type SyncSessionClientDTO,
  type StartSyncRequest,
  type StartSyncResponse,
  type SyncHistoryRequest,
  type SyncHistoryResponse,
  type DeviceInfoDTO,
} from '@dailyuse/contracts/sync';
import { eventBus } from '@dailyuse/utils';

/**
 * 发布会话相关事件
 */
async function publishSessionEvents(eventType: string, data: unknown): Promise<void> {
  await eventBus.emit(eventType, data);
}

/**
 * SyncSession Application Service
 */
export class SyncSessionApplicationService {
  constructor(
    private readonly sessionRepository: ISyncSessionRepository,
    private readonly profileRepository: ISyncProfileRepository,
    private readonly accountUuid: string,
    private readonly deviceInfo: DeviceInfoDTO,
  ) {}

  /**
   * 启动同步会话
   */
  async startSync(request: StartSyncRequest): Promise<StartSyncResponse> {
    // 1. 获取配置文件
    let profile: SyncProfile | null = null;
    if (request.profileId) {
      profile = await this.profileRepository.findByUuid(request.profileId);
    } else {
      profile = await this.profileRepository.findDefault();
    }

    if (!profile) {
      throw new Error('未找到同步配置，请先创建同步配置');
    }

    if (!profile.canSync()) {
      throw new Error(`同步配置 "${profile.name}" 无法同步: ${profile.statusLabel}`);
    }

    // 2. 检查是否已有进行中的会话
    const inProgressSessions = await this.sessionRepository.findInProgress();
    if (inProgressSessions.length > 0) {
      throw new Error('已有同步正在进行中，请等待完成或取消');
    }

    // 3. 确定同步参数
    const direction = request.direction ?? profile.syncConfig.direction;
    const strategy = request.forceFullSync 
      ? SyncStrategy.FULL 
      : (request.strategy ?? SyncStrategy.AUTO);

    // 4. 创建起始版本 - 使用 profile 的最后同步版本或创建新版本
    const startVersion = profile.lastSyncVersion ?? SyncVersion.create(this.deviceInfo.deviceId).toServerDTO();

    // 5. 创建会话
    const session = SyncSession.create({
      profileId: profile.uuid,
      direction,
      strategy,
      triggerType: request.triggerType,
      triggerDevice: this.deviceInfo,
      startVersion,
    });

    // 6. 持久化
    await this.sessionRepository.save(session);

    // 7. 发布事件
    await publishSessionEvents('sync.session.started', {
      sessionId: session.uuid,
      profileId: profile.uuid,
      accountUuid: this.accountUuid,
      direction,
      strategy,
      triggerType: request.triggerType,
    });

    return {
      sessionId: session.uuid,
      session: session.toClientDTO(),
    };
  }

  /**
   * 取消同步会话
   */
  async cancelSync(sessionId: string, reason?: string): Promise<SyncSessionClientDTO> {
    const session = await this.sessionRepository.findByUuid(sessionId);
    if (!session) {
      throw new Error(`同步会话不存在: ${sessionId}`);
    }

    if (session.isFinished) {
      throw new Error('同步会话已结束，无法取消');
    }

    session.cancel();
    await this.sessionRepository.save(session);

    await publishSessionEvents('sync.session.cancelled', {
      sessionId,
      accountUuid: this.accountUuid,
      reason,
    });

    return session.toClientDTO();
  }

  /**
   * 重试失败的同步会话
   */
  async retrySync(sessionId: string): Promise<StartSyncResponse> {
    const originalSession = await this.sessionRepository.findByUuid(sessionId);
    if (!originalSession) {
      throw new Error(`同步会话不存在: ${sessionId}`);
    }

    if (originalSession.status !== SyncSessionStatus.FAILED) {
      throw new Error('只能重试失败的同步会话');
    }

    if (!originalSession.canRetry) {
      throw new Error('此同步会话不支持重试');
    }

    // 使用原会话的配置创建新会话
    return this.startSync({
      profileId: originalSession.profileId,
      direction: originalSession.direction,
      strategy: originalSession.strategy,
      triggerType: SyncTriggerType.MANUAL,
    });
  }

  /**
   * 获取当前会话
   */
  async getCurrentSession(): Promise<SyncSessionClientDTO | null> {
    const sessions = await this.sessionRepository.findInProgress();
    return sessions.length > 0 ? sessions[0].toClientDTO() : null;
  }

  /**
   * 获取会话详情
   */
  async getSession(sessionId: string): Promise<SyncSessionClientDTO | null> {
    const session = await this.sessionRepository.findByUuid(sessionId);
    return session ? session.toClientDTO() : null;
  }

  /**
   * 获取同步历史
   */
  async getSyncHistory(request: SyncHistoryRequest): Promise<SyncHistoryResponse> {
    const page = request.page ?? 1;
    const pageSize = request.pageSize ?? 20;
    const offset = (page - 1) * pageSize;

    const sessions = await this.sessionRepository.findByQuery({
      profileId: request.profileId,
      limit: pageSize,
      offset,
    });

    const total = await this.sessionRepository.count({
      profileId: request.profileId,
    });

    // 计算统计
    const allSessions = await this.sessionRepository.findByQuery({
      profileId: request.profileId,
    });

    const successfulSyncs = allSessions.filter(
      (s: SyncSession) => s.status === SyncSessionStatus.COMPLETED
    ).length;
    const failedSyncs = allSessions.filter(
      (s: SyncSession) => s.status === SyncSessionStatus.FAILED
    ).length;

    const hasMore = offset + sessions.length < total;

    return {
      sessions: sessions.map((s: SyncSession) => s.toClientDTO()),
      total,
      page,
      pageSize,
      hasMore,
      summary: {
        totalSyncs: total,
        successfulSyncs,
        failedSyncs,
      },
    };
  }

  /**
   * 获取最近一次同步会话
   */
  async getLatestSession(profileId?: string): Promise<SyncSessionClientDTO | null> {
    if (profileId) {
      const session = await this.sessionRepository.findLatestByProfileId(profileId);
      return session ? session.toClientDTO() : null;
    }

    const sessions = await this.sessionRepository.findByQuery({ limit: 1 });
    return sessions.length > 0 ? sessions[0].toClientDTO() : null;
  }

  /**
   * 更新会话状态 (内部使用)
   */
  async updateSessionStatus(
    sessionId: string,
    action: 'start' | 'syncing' | 'complete' | 'fail',
    data?: any,
  ): Promise<SyncSessionClientDTO> {
    const session = await this.sessionRepository.findByUuid(sessionId);
    if (!session) {
      throw new Error(`同步会话不存在: ${sessionId}`);
    }

    switch (action) {
      case 'start':
        session.start();
        break;
      case 'syncing':
        session.startSyncing();
        break;
      case 'complete':
        session.complete(data.endVersion, data.statistics);
        // 更新配置文件的最后同步信息
        const profile = await this.profileRepository.findByUuid(session.profileId);
        if (profile) {
          profile.recordSyncComplete(
            data.endVersion,
            'success',
            data.durationMs ?? 0,
          );
          await this.profileRepository.save(profile);
        }
        break;
      case 'fail':
        session.fail(data.error, data.canRetry ?? true);
        break;
    }

    await this.sessionRepository.save(session);
    return session.toClientDTO();
  }
}
