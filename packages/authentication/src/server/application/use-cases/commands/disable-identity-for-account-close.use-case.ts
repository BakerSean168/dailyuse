/**
 * Disable Identity For Account Close Use Case
 *
 * Cascades account closure into Authentication: disable identity + revoke sessions.
 * Account 注销级联到 Auth：禁用身份并撤销全部会话。
 */

import type { Result } from '@dailyuse/contracts/result';
import { ok } from '@dailyuse/contracts/result';
import { IdentityId } from '@dailyuse/domain-shared/shared';
import type {
  IAuthIdentityRepository,
  IAuthSessionRepository,
} from '../../../domain';
import { AuthIdentityStatus } from '../../../domain';
import { createLogger } from '@dailyuse/utils/logger';

const logger = createLogger('DisableIdentityForAccountClose');

export class DisableIdentityForAccountCloseUseCase {
  constructor(
    private readonly identityRepository: IAuthIdentityRepository,
    private readonly sessionRepository: IAuthSessionRepository,
  ) {}

  async execute(identityId: string): Promise<Result<void>> {
    const id = IdentityId.of(identityId);
    const identity = await this.identityRepository.findById(id);

    if (!identity) {
      logger.warn('[DisableIdentityForAccountClose] Identity not found; still revoking sessions', {
        identityId,
      });
    } else if (!AuthIdentityStatus.isDisabled(identity.status)) {
      identity.disable();
      await this.identityRepository.save(identity);
    }

    await this.sessionRepository.removeAllByIdentityId(id);

    logger.info('[DisableIdentityForAccountClose] Identity disabled and sessions revoked', {
      identityId,
    });
    return ok(undefined);
  }
}
