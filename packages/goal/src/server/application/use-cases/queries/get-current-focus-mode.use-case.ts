import type { IFocusModeRepository } from '../../../domain';
import { createLogger } from '@memoflow/utils/logger';
import type { Result } from '@memoflow/contracts/result';
import { ok } from '@memoflow/contracts/result';
import type { FocusModeDTO } from '@memoflow/contracts/goal';

export class GetCurrentFocusModeUseCase {
  private readonly logger = createLogger('goal:get-current-focus-mode');

  constructor(private readonly focusModeRepository: IFocusModeRepository) {}

  async execute(identityId: string): Promise<Result<FocusModeDTO | null>> {
    this.logger.info('开始获取当前专注模式', { identityId });
    const activeFocusMode = await this.focusModeRepository.findActiveByIdentityId(identityId);
    this.logger.info('获取当前专注模式结果', {
      identityId,
      hasActiveFocusMode: !!activeFocusMode,
      activeFocusModeId: activeFocusMode?.id ?? null,
      isActive: activeFocusMode?.isActive ?? null,
      remainingDays: activeFocusMode?.getRemainingDays?.() ?? null,
    });
    return ok(activeFocusMode ? activeFocusMode.toDTO() : null);
  }
}
