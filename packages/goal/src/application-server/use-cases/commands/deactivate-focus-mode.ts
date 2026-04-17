import type { IFocusModeRepository } from '@/domain-server';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';
import type { FocusModeClientDTO } from '@dailyuse/contracts/goal';

export class DeactivateFocusMode {
  constructor(private readonly focusModeRepository: IFocusModeRepository) {}

  async execute(identityId: string): Promise<Result<FocusModeClientDTO | null>> {
    const activeFocusMode = await this.focusModeRepository.findActiveByIdentityId(identityId);
    if (!activeFocusMode) {
      return error('NOT_FOUND', 'Focus mode not found');
    }

    const updated = activeFocusMode.deactivate();
    await this.focusModeRepository.save(updated);
    return ok(updated.toClientDTO());
  }
}
