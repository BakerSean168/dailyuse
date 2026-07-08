import type { IFocusModeRepository } from '../../../domain';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';
import type { FocusModeDTO } from '@dailyuse/contracts/goal';

export class DeactivateFocusModeUseCase {
  constructor(private readonly focusModeRepository: IFocusModeRepository) {}

  async execute(identityId: string): Promise<Result<FocusModeDTO | null>> {
    const activeFocusMode = await this.focusModeRepository.findActiveByIdentityId(identityId);
    if (!activeFocusMode) {
      return error('NOT_FOUND', 'Focus mode not found');
    }

    const updated = activeFocusMode.deactivate();
    await this.focusModeRepository.save(updated);
    return ok(updated.toDTO());
  }
}
