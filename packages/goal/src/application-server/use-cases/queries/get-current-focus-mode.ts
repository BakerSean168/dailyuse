import type { IFocusModeRepository } from '@/domain-server';
import { createLogger } from '@dailyuse/utils';
import type { Result } from '@dailyuse/contracts/result';
import { ok } from '@dailyuse/contracts/result';
import type { FocusModeClientDTO } from '@dailyuse/contracts/goal';

export class GetCurrentFocusMode {
  private readonly logger = createLogger('goal:get-current-focus-mode');

  constructor(private readonly focusModeRepository: IFocusModeRepository) {}

  async execute(identityId: string): Promise<Result<FocusModeClientDTO | null>> {
    this.logger.info('开始获取当前专注模式', { identityId });
    const activeFocusMode = await this.focusModeRepository.findActiveByIdentityId(identityId);
    this.logger.info('获取当前专注模式结果', {
      identityId,
      hasActiveFocusMode: !!activeFocusMode,
      activeFocusModeId: activeFocusMode?.id ?? null,
      isActive: activeFocusMode?.isActive ?? null,
      remainingDays: activeFocusMode?.getRemainingDays?.() ?? null,
    });
    return ok(activeFocusMode ? activeFocusMode.toClientDTO() : null);
  }
}
