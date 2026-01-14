/**
 * Create Sync Profile Use Case
 *
 * 创建同步配置用例
 */

import { SyncProfileApplicationService } from '../services/SyncProfileApplicationService';
import type { ISyncProfileRepository } from '@dailyuse/domain-server/sync';
import type {
  CreateSyncProfileRequest,
  SyncProfileClientDTO,
} from '@dailyuse/contracts/sync';

/**
 * Create Sync Profile Use Case
 */
export class CreateSyncProfileUseCase {
  private profileService: SyncProfileApplicationService;

  constructor(
    profileRepository: ISyncProfileRepository,
    accountUuid: string,
  ) {
    this.profileService = new SyncProfileApplicationService(
      profileRepository,
      accountUuid,
    );
  }

  /**
   * 执行创建同步配置
   */
  async execute(request: CreateSyncProfileRequest): Promise<SyncProfileClientDTO> {
    return this.profileService.createProfile(request);
  }
}
