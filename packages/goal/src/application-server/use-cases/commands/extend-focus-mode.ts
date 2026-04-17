import type { IFocusModeRepository } from '@/domain-server';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';
import type { FocusModeClientDTO } from '@dailyuse/contracts/goal';

export class ExtendFocusMode {
  constructor(private readonly focusModeRepository: IFocusModeRepository) {}

  async execute(identityId: string, newEndTime: number): Promise<Result<FocusModeClientDTO>> {
    const activeFocusMode = await this.focusModeRepository.findActiveByIdentityId(identityId);
    if (!activeFocusMode) {
      return error('NOT_FOUND', 'Focus mode not found');
    }

    const updated = activeFocusMode.extend(newEndTime);
    await this.focusModeRepository.save(updated);
    return ok(updated.toClientDTO());
  }
}
