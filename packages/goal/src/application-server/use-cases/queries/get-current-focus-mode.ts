import type { IFocusModeRepository } from '@/domain-server';
import type { Result } from '@dailyuse/contracts/result';
import { ok } from '@dailyuse/contracts/result';
import type { FocusModeClientDTO } from '@dailyuse/contracts/goal';

export class GetCurrentFocusMode {
  constructor(private readonly focusModeRepository: IFocusModeRepository) {}

  async execute(identityId: string): Promise<Result<FocusModeClientDTO | null>> {
    const activeFocusMode = await this.focusModeRepository.findActiveByIdentityId(identityId);
    return ok(activeFocusMode ? activeFocusMode.toClientDTO() : null);
  }
}
