/**
 * Resolve Conflict Use Case
 *
 * 解决同步冲突用例
 */

import { SyncConflictApplicationService } from '../services/SyncConflictApplicationService';
import { SyncSessionApplicationService } from '../services/SyncSessionApplicationService';
import type {
  ISyncConflictRepository,
  ISyncSessionRepository,
  ISyncProfileRepository,
} from '@dailyuse/domain-server/sync';
import type {
  ResolveConflictRequest,
  SyncConflictClientDTO,
  DeviceInfoDTO,
} from '@dailyuse/contracts/sync';

/**
 * Resolve Conflict Use Case
 */
export class ResolveConflictUseCase {
  private conflictService: SyncConflictApplicationService;
  private sessionService: SyncSessionApplicationService;

  constructor(
    conflictRepository: ISyncConflictRepository,
    sessionRepository: ISyncSessionRepository,
    profileRepository: ISyncProfileRepository,
    accountUuid: string,
    deviceInfo: DeviceInfoDTO,
  ) {
    this.conflictService = new SyncConflictApplicationService(
      conflictRepository,
      accountUuid,
    );
    this.sessionService = new SyncSessionApplicationService(
      sessionRepository,
      profileRepository,
      accountUuid,
      deviceInfo,
    );
  }

  /**
   * 解决单个冲突
   */
  async execute(request: ResolveConflictRequest): Promise<SyncConflictClientDTO> {
    return this.conflictService.resolveConflict(request);
  }

  /**
   * 解决所有可自动解决的冲突
   */
  async autoResolveAll(sessionId: string): Promise<SyncConflictClientDTO[]> {
    return this.conflictService.autoResolveConflicts(sessionId);
  }

  /**
   * 批量解决冲突
   */
  async resolveMany(requests: ResolveConflictRequest[]): Promise<SyncConflictClientDTO[]> {
    return this.conflictService.resolveConflicts(requests);
  }

  /**
   * 检查是否还有未解决冲突
   */
  async checkRemainingConflicts(sessionId: string): Promise<{
    hasConflicts: boolean;
    count: number;
  }> {
    const count = await this.conflictService.getUnresolvedCount(sessionId);
    return {
      hasConflicts: count > 0,
      count,
    };
  }
}
