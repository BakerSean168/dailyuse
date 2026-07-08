import type { IFocusModeRepository } from '../../../domain';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';
import type { FocusModeDTO } from '@dailyuse/contracts/goal';

export class ExtendFocusModeUseCase {
  constructor(private readonly focusModeRepository: IFocusModeRepository) {}

  async execute(identityId: string, newEndTime: number): Promise<Result<FocusModeDTO>> {
    const activeFocusMode = await this.focusModeRepository.findActiveByIdentityId(identityId);
    if (!activeFocusMode) {
      return error('NOT_FOUND', 'Focus mode not found');
    }

    const updated = activeFocusMode.extend(newEndTime);
    await this.focusModeRepository.save(updated);
    return ok(updated.toDTO());
  }
}
